-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'compensated');
CREATE TYPE leave_type   AS ENUM ('annual', 'sick', 'casual', 'unpaid', 'other');
CREATE TYPE user_role    AS ENUM ('employee', 'manager');

-- Allowed domains (company email whitelist)
CREATE TABLE public.allowed_domains (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain       TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  role             user_role NOT NULL DEFAULT 'employee',
  company_domain   TEXT NOT NULL,
  department       TEXT,
  avatar_url       TEXT,
  manager_id       UUID REFERENCES public.profiles(id),
  annual_allowance INT NOT NULL DEFAULT 20,
  sick_allowance   INT NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave requests
CREATE TABLE public.leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type      leave_type NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  total_days      INT NOT NULL,
  status          leave_status NOT NULL DEFAULT 'pending',
  reason          TEXT,
  manager_comment TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days    CHECK (total_days > 0)
);

CREATE INDEX idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_status   ON public.leave_requests(status);
CREATE INDEX idx_leave_dates    ON public.leave_requests(start_date, end_date);

-- Company holidays
CREATE TABLE public.company_holidays (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_domain TEXT NOT NULL,
  name           TEXT NOT NULL,
  date           DATE NOT NULL,
  created_by     UUID NOT NULL REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_domain_date UNIQUE (company_domain, date)
);

CREATE INDEX idx_holidays_domain_date ON public.company_holidays(company_domain, date);

-- Leave balances (per employee, per year)
CREATE TABLE public.leave_balances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year        INT NOT NULL,
  leave_type  leave_type NOT NULL,
  allocated   INT NOT NULL DEFAULT 0,
  used        INT NOT NULL DEFAULT 0,
  pending     INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_balance UNIQUE (employee_id, year, leave_type)
);

-- Notification log
CREATE TABLE public.notification_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email  TEXT NOT NULL,
  subject          TEXT NOT NULL,
  type             TEXT NOT NULL,
  leave_request_id UUID REFERENCES public.leave_requests(id),
  status           TEXT NOT NULL DEFAULT 'sent',
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
