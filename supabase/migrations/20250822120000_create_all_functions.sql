-- Functions to handle user management
CREATE OR REPLACE FUNCTION public.update_user_role(
    user_id_arg UUID,
    new_role_arg TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.user_roles WHERE user_id = auth.uid();
    
    IF caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Permission denied. Only administrators can update user roles.';
    END IF;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_arg, new_role_arg)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_admin_deletion(target_user_id_arg UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
    target_user_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.user_roles WHERE user_id = auth.uid();
    IF caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Permission denied. Only administrators can request to delete a user.';
    END IF;

    SELECT role INTO target_user_role FROM public.user_roles WHERE user_id = target_user_id_arg;
    IF target_user_role <> 'admin' THEN
        RAISE EXCEPTION 'This function is only for requesting the deletion of other administrators.';
    END IF;

    INSERT INTO public.approvals (user_id, target_user_id, approval_type, status)
    VALUES (auth.uid(), target_user_id_arg, 'DELETE_ADMIN', 'pending');

    RETURN 'Deletion request for admin user has been submitted for owner approval.';
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_by_owner(target_user_id_arg UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_caller_owner BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.owners WHERE user_id = auth.uid()
    ) INTO is_caller_owner;

    IF NOT is_caller_owner THEN
        RAISE EXCEPTION 'Permission denied. Only owners can approve user deletions.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.approvals
        WHERE target_user_id = target_user_id_arg AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'No pending deletion approval found for this user.';
    END IF;

    PERFORM supabase.auth.admin_delete_user(target_user_id_arg);

    UPDATE public.approvals
    SET status = 'approved'
    WHERE target_user_id = target_user_id_arg;
    
    RETURN 'Admin user has been successfully deleted.';
END;
$$;

CREATE OR REPLACE FUNCTION public.add_owner(
    user_id_arg UUID,
    designation_arg TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
    caller_profile_id UUID;
BEGIN
    SELECT role, profile_id INTO caller_role, caller_profile_id
    FROM public.user_roles WHERE user_id = auth.uid();
    
    IF caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Permission denied. Only administrators can add owners.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.owners WHERE user_id = user_id_arg) THEN
        RAISE EXCEPTION 'This user is already listed as an owner.';
    END IF;

    DECLARE
        owner_full_name TEXT;
        owner_email TEXT;
    BEGIN
        SELECT full_name, email INTO owner_full_name, owner_email
        FROM public.profiles WHERE id = user_id_arg;

        INSERT INTO public.owners (user_id, profile_id, full_name, email, designation, is_admin)
        VALUES (
            user_id_arg,
            caller_profile_id,
            owner_full_name,
            owner_email,
            designation_arg,
            TRUE
        );
    END;
END;
$$;

-- Function for denying a deletion request
CREATE OR REPLACE FUNCTION public.deny_admin_deletion_request(
    approval_id_arg UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_caller_owner BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.owners WHERE user_id = auth.uid()
    ) INTO is_caller_owner;

    IF NOT is_caller_owner THEN
        RAISE EXCEPTION 'Permission denied. Only owners can deny deletion requests.';
    END IF;

    UPDATE public.approvals
    SET status = 'rejected'
    WHERE id = approval_id_arg AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending approval request not found.';
    END IF;

    RETURN 'Admin deletion request has been successfully denied.';
END;
$$;

-- Functions for inventory and invoices
CREATE OR REPLACE FUNCTION public.decrement_inventory_stock(
    product_id_arg UUID,
    quantity_arg NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.inventory_items
    SET current_stock = current_stock - quantity_arg
    WHERE product_id = product_id_arg;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_inventory_stock(
    product_id_arg UUID,
    quantity_arg NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.inventory_items
    SET current_stock = current_stock + quantity_arg
    WHERE product_id = product_id_arg;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invoice_with_line_items(
    customer_id_arg UUID,
    invoice_date_arg DATE,
    due_date_arg DATE,
    status_arg TEXT,
    line_items_arg JSONB
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invoice public.invoices;
    line_item_data JSONB;
    user_id_from_auth UUID;
BEGIN
    user_id_from_auth := auth.uid();

    INSERT INTO public.invoices (
        user_id,
        customer_id,
        issue_date,
        due_date,
        status,
        total_amount
    )
    VALUES (
        user_id_from_auth,
        customer_id_arg,
        invoice_date_arg,
        due_date_arg,
        status_arg,
        (SELECT SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC) FROM jsonb_array_elements(line_items_arg) AS item)
    )
    RETURNING * INTO new_invoice;

    FOR line_item_data IN SELECT * FROM jsonb_array_elements(line_items_arg)
    LOOP
        INSERT INTO public.invoice_line_items (
            user_id,
            invoice_id,
            product_id,
            quantity,
            unit_price
        )
        VALUES (
            user_id_from_auth,
            new_invoice.id,
            (line_item_data->>'product_id')::UUID,
            (line_item_data->>'quantity')::NUMERIC,
            (line_item_data->>'unit_price')::NUMERIC
        );

        PERFORM public.decrement_inventory_stock(
            (line_item_data->>'product_id')::UUID,
            (line_item_data->>'quantity')::NUMERIC
        );
    END LOOP;

    RETURN new_invoice;
END;
$$;

-- Functions for general expenses
CREATE OR REPLACE FUNCTION public.create_expense_with_line_items(
    supplier_id_arg UUID,
    expense_date_arg DATE,
    line_items_arg JSONB
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_expense public.expenses;
    line_item_data JSONB;
    user_id_from_auth UUID;
BEGIN
    user_id_from_auth := auth.uid();

    INSERT INTO public.expenses (
        user_id,
        supplier_id,
        expense_date,
        total_amount,
        description
    )
    VALUES (
        user_id_from_auth,
        supplier_id_arg,
        expense_date_arg,
        (SELECT SUM((item->>'amount')::NUMERIC) FROM jsonb_array_elements(line_items_arg) AS item),
        (SELECT item->>'description' FROM jsonb_array_elements(line_items_arg) AS item LIMIT 1)
    )
    RETURNING * INTO new_expense;

    FOR line_item_data IN SELECT * FROM jsonb_array_elements(line_items_arg)
    LOOP
        INSERT INTO public.expense_line_items (
            user_id,
            expense_id,
            account_id,
            description,
            amount
        )
        VALUES (
            user_id_from_auth,
            new_expense.id,
            (line_item_data->>'account_id')::UUID,
            (line_item_data->>'description')::TEXT,
            (line_item_data->>'amount')::NUMERIC
        );
    END LOOP;

    RETURN new_expense;
END;
$$;

-- Functions for purchase orders
CREATE OR REPLACE FUNCTION public.create_purchase_order_with_line_items(
    supplier_id_arg UUID,
    order_date_arg DATE,
    line_items_arg JSONB
)
RETURNS public.purchase_orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_po public.purchase_orders;
    line_item_data JSONB;
    user_id_from_auth UUID;
BEGIN
    user_id_from_auth := auth.uid();

    INSERT INTO public.purchase_orders (
        user_id,
        supplier_id,
        order_date,
        total_amount,
        status
    )
    VALUES (
        user_id_from_auth,
        supplier_id_arg,
        order_date_arg,
        (SELECT SUM((item->>'quantity')::NUMERIC * (item->>'unit_cost')::NUMERIC) FROM jsonb_array_elements(line_items_arg) AS item),
        'Sent'
    )
    RETURNING * INTO new_po;

    FOR line_item_data IN SELECT * FROM jsonb_array_elements(line_items_arg)
    LOOP
        INSERT INTO public.purchase_order_line_items (
            user_id,
            purchase_order_id,
            product_id,
            quantity,
            unit_cost
        )
        VALUES (
            user_id_from_auth,
            new_po.id,
            (line_item_data->>'product_id')::UUID,
            (line_item_data->>'quantity')::NUMERIC,
            (line_item_data->>'unit_cost')::NUMERIC
        );
    END LOOP;

    RETURN new_po;
END;
$$;

-- Other functions
CREATE OR REPLACE FUNCTION public.get_pending_approvals()
 RETURNS SETOF approvals AS $$
BEGIN
  RETURN QUERY
    SELECT
      a.id,
      a.user_id,
      a.target_user_id,
      a.approval_type,
      a.status,
      a.created_at
    FROM
      approvals a
    WHERE
      a.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_trial_balance_by_date(
    start_date_param TIMESTAMPTZ,
    end_date_param TIMESTAMPTZ,
    account_id_param UUID
)
RETURNS TABLE(
    id UUID,
    transaction_date DATE,
    description TEXT,
    debit NUMERIC,
    credit NUMERIC,
    account_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.transaction_date,
        je.description,
        je.debit,
        je.credit,
        coa.name AS account_name
    FROM
        public.journal_entries AS je
    JOIN
        public.chart_of_accounts AS coa ON je.account_id = coa.id
    WHERE
        je.transaction_date >= start_date_param
        AND je.transaction_date <= end_date_param
        AND (account_id_param IS NULL OR je.account_id = account_id_param)
    ORDER BY
        je.transaction_date;
END;
$$;

-- Create the new user handler trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, has_completed_setup, full_name, username, email)
  VALUES (NEW.id, FALSE, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role, profile_id)
  SELECT NEW.id, 'admin', NEW.id;

  RETURN NEW;
END;
$$;