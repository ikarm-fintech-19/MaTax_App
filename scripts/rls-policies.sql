-- Run this in Supabase SQL Editor after the base migration.

-- Profiles: admin can see all
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Profiles: experts can see their assigned clients
CREATE POLICY "Experts can view assigned clients" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT expert_id FROM expert_clients WHERE client_id = id)
  );

-- Declarations: admin can see all
CREATE POLICY "Admins can view all declarations" ON declarations
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Declarations: experts can see their clients' declarations
CREATE POLICY "Experts can view client declarations" ON declarations
  FOR SELECT USING (
    auth.uid() IN (SELECT expert_id FROM expert_clients WHERE client_id = user_id)
  );

-- Expert_clients: admin can manage all
CREATE POLICY "Admins can manage expert_clients" ON expert_clients
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Expert_clients: clients can see their own assignments
CREATE POLICY "Clients can view own expert assignment" ON expert_clients
  FOR SELECT USING (auth.uid() = client_id);

-- Audit_log: admin can see all
CREATE POLICY "Admins can view all audit_log" ON audit_log
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
