-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_same_domain" ON public.profiles
  FOR SELECT USING (
    company_domain = (SELECT company_domain FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_manager" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
  );

-- LEAVE REQUESTS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaves_select_own" ON public.leave_requests
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "leaves_select_manager" ON public.leave_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles mgr
      JOIN public.profiles emp ON emp.id = leave_requests.employee_id
      WHERE mgr.id = auth.uid()
        AND mgr.role = 'manager'
        AND mgr.company_domain = emp.company_domain
    )
  );

CREATE POLICY "leaves_insert_own" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "leaves_delete_pending_own" ON public.leave_requests
  FOR DELETE USING (employee_id = auth.uid() AND status = 'pending');

CREATE POLICY "leaves_update_manager" ON public.leave_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles mgr
      JOIN public.profiles emp ON emp.id = leave_requests.employee_id
      WHERE mgr.id = auth.uid()
        AND mgr.role = 'manager'
        AND mgr.company_domain = emp.company_domain
    )
  );

-- COMPANY HOLIDAYS
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holidays_read_same_domain" ON public.company_holidays
  FOR SELECT USING (
    company_domain = (SELECT company_domain FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "holidays_insert_manager" ON public.company_holidays
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "holidays_delete_manager" ON public.company_holidays
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
  );

-- LEAVE BALANCES
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balances_select_own" ON public.leave_balances
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "balances_select_manager" ON public.leave_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles mgr
      JOIN public.profiles emp ON emp.id = leave_balances.employee_id
      WHERE mgr.id = auth.uid()
        AND mgr.role = 'manager'
        AND mgr.company_domain = emp.company_domain
    )
  );

-- ALLOWED DOMAINS (read-only for server validation)
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allowed_domains_read_all" ON public.allowed_domains
  FOR SELECT USING (true);
