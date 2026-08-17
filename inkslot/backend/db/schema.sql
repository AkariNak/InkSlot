-- Inkslot schema v1

CREATE TABLE studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- used for public booking page URL: inkslot.com/book/{slug}
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    stripe_account_id TEXT, -- Stripe Connect account for the studio
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    bio TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
    deposit_amount_cents INTEGER NOT NULL DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    stripe_payment_intent_id TEXT,
    design_reference_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE consent_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    health_disclosures JSONB NOT NULL, -- structured answers, e.g. allergies, medications, conditions
    signature_data TEXT NOT NULL, -- base64 signature image or typed legal name
    pdf_url TEXT, -- generated PDF stored in S3/equivalent
    signed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_artists_studio ON artists(studio_id);
CREATE INDEX idx_clients_studio ON clients(studio_id);
CREATE INDEX idx_appointments_studio ON appointments(studio_id);
CREATE INDEX idx_appointments_artist ON appointments(artist_id);
CREATE INDEX idx_appointments_status ON appointments(status);
