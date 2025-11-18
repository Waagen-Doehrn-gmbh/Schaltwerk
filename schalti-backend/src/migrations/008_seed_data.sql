-- Seed Data
-- Passwörter sind alle "password123" (gehasht mit bcrypt)
-- In Production sollten diese geändert werden!

-- Users (Passwort-Hash für "password123")
-- Rollen werden zunächst als 'mitarbeiter' erstellt und dann durch Migration 011 aktualisiert
-- Berechtigungen werden gesetzt, damit Migration 011 die Rollen korrekt zuordnen kann
INSERT INTO users (id, email, password_hash, name, initialen, rolle, berechtigungen) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'stefan.haering@schalti.de', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Stefan Häring', 'SH', 'admin', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 'jamie.szymiczek@schalti.de', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Jamie Szymiczek', 'JS', 'mitarbeiter', '["abnahme"]'::jsonb),
('550e8400-e29b-41d4-a716-446655440003', 'michael.weber@schalti.de', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Michael Weber', 'MW', 'mitarbeiter', '["abnahme"]'::jsonb),
('550e8400-e29b-41d4-a716-446655440004', 'thomas.mueller@schalti.de', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Thomas Müller', 'TM', 'mitarbeiter', '["endabnahme"]'::jsonb),
('550e8400-e29b-41d4-a716-446655440005', 'anna.schmidt@schalti.de', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Anna Schmidt', 'AS', 'mitarbeiter', '[]'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- Projekte
INSERT INTO projekte (id, name, standort, status, schaltschrank_nummer, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Bolz Einfahrt', 'Dorsten', 'in_bearbeitung', 'SS-2024-001', '2024-12-01'),
('660e8400-e29b-41d4-a716-446655440002', 'Meyer Schaltanlage', 'Essen', 'abgeschlossen', 'SS-2024-042', '2024-11-15'),
('660e8400-e29b-41d4-a716-446655440003', 'Schmidt Steuerung', 'Bochum', 'planung', NULL, '2024-12-10'),
('660e8400-e29b-41d4-a716-446655440004', 'Koch Industrieanlage', 'Dortmund', 'in_bearbeitung', 'SS-2024-078', '2024-11-20'),
('660e8400-e29b-41d4-a716-446655440005', 'Wagner Verteilerschrank', 'Gelsenkirchen', 'in_bearbeitung', 'SS-2024-105', '2024-12-05'),
('660e8400-e29b-41d4-a716-446655440006', 'Fischer Automatisierung', 'Recklinghausen', 'planung', NULL, '2024-12-12')
ON CONFLICT DO NOTHING;

-- Komponenten
INSERT INTO komponenten (id, name, artikel_nummer, status, projekt_id) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Hauptschalter 63A', 'HS-63A-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', 'Sicherungsautomaten 16A', 'LS-16A-005', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', 'Relais 24V', 'REL-24V-010', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', 'Schaltkontakt', 'SK-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440005', 'LED-Leuchte', 'LED-24V-001', 'ausstehend', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440006', 'Klemmenleiste', 'KL-10-001', 'ausstehend', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440007', 'Industrie-PC', 'IPC-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440002'),
('770e8400-e29b-41d4-a716-446655440008', 'Lüfter 230V', 'LUE-230V-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440002'),
('770e8400-e29b-41d4-a716-446655440009', 'Heizung 100W', 'HEZ-100W-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440002'),
('770e8400-e29b-41d4-a716-446655440010', 'Schaltrelais 230V', 'SR-230V-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440002'),
('770e8400-e29b-41d4-a716-446655440011', 'Spannungsüberwachung', 'SU-001', 'abgeschlossen', '660e8400-e29b-41d4-a716-446655440002')
ON CONFLICT DO NOTHING;

-- Aufgaben
INSERT INTO aufgaben (id, name) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Grundplatte Bestückt und Verdrahtet'),
('880e8400-e29b-41d4-a716-446655440002', 'Funktionstest durchgeführt'),
('880e8400-e29b-41d4-a716-446655440003', 'Erdungen hergestellt'),
('880e8400-e29b-41d4-a716-446655440004', 'Kabel verlegt'),
('880e8400-e29b-41d4-a716-446655440005', 'Schaltplan geprüft'),
('880e8400-e29b-41d4-a716-446655440006', 'Sicherheitsprüfung durchgeführt'),
('880e8400-e29b-41d4-a716-446655440007', 'Inbetriebnahme'),
('880e8400-e29b-41d4-a716-446655440008', 'Dokumentation erstellt'),
('880e8400-e29b-41d4-a716-446655440009', 'Qualitätskontrolle'),
('880e8400-e29b-41d4-a716-446655440010', 'Montage abgeschlossen'),
('880e8400-e29b-41d4-a716-446655440011', 'Verdrahtung geprüft'),
('880e8400-e29b-41d4-a716-446655440012', 'Komponenten getestet'),
('880e8400-e29b-41d4-a716-446655440013', 'Anschlüsse hergestellt'),
('880e8400-e29b-41d4-a716-446655440014', 'Beschriftung angebracht'),
('880e8400-e29b-41d4-a716-446655440015', 'Technische Abnahme'),
('880e8400-e29b-41d4-a716-446655440016', 'Endabnahme')
ON CONFLICT (name) DO NOTHING;

