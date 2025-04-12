/*
  # Initial Database Setup for Saisonnalité

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - user_type (enum: producer/consumer)
      - full_name (text)
      - avatar_url (text, optional)
      - created_at (timestamp)
    - products
      - id (uuid)
      - producer_id (uuid, references profiles)
      - name (text)
      - description (text)
      - availability_start (date)
      - availability_end (date)
      - created_at (timestamp)
    - locations
      - id (uuid)
      - producer_id (uuid, references profiles)
      - name (text)
      - address (text)
      - coordinates (point)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE user_type AS ENUM ('producer', 'consumer');

-- Create profiles table
CREATE TABLE profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    user_type user_type NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    availability_start date,
    availability_end date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text NOT NULL,
    coordinates point,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Producers can insert their own products"
    ON products FOR INSERT
    WITH CHECK (
        auth.uid() = producer_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type = 'producer'
        )
    );

CREATE POLICY "Producers can update their own products"
    ON products FOR UPDATE
    USING (
        auth.uid() = producer_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type = 'producer'
        )
    );

CREATE POLICY "Locations are viewable by everyone"
    ON locations FOR SELECT
    USING (true);

CREATE POLICY "Producers can manage their own locations"
    ON locations FOR ALL
    USING (
        auth.uid() = producer_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type = 'producer'
        )
    );