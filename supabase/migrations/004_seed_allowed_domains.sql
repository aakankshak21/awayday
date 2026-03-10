-- Seed your company domain here before deploying
-- Replace with your actual company domain
INSERT INTO public.allowed_domains (domain, company_name)
VALUES ('company.com', 'My Company')
ON CONFLICT (domain) DO NOTHING;
