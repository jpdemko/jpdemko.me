CREATE extension IF NOT EXISTS citext;

DO $$ BEGIN
	CREATE DOMAIN valid_email AS citext CHECK ( value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' );
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE users (
	uid SERIAL PRIMARY KEY,
	provider_id VARCHAR(40) UNIQUE,
	email valid_email,
	username VARCHAR(50) NOT NULL,
	user_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_provider_id ON users(provider_id);

--

CREATE TABLE messages (
	mid BIGSERIAL PRIMARY KEY,
	room VARCHAR(80) NOT NULL,
	message TEXT NOT NULL,
	msg_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	author INT NOT NULL REFERENCES users(uid)
);

CREATE INDEX msg_author ON messages(author);

--

DO $$ BEGIN
	CREATE TYPE valid_friendship_status AS ENUM ('REJECTED', 'ACCEPTED', 'PENDING');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE friendships (
	id serial PRIMARY KEY,
	user_a INT REFERENCES users(id),
	user_b INT REFERENCES users(id),
	status valid_friendship_status NOT NULL DEFAULT 'PENDING',
	CHECK (user_a < user_b)
);

CREATE INDEX friendship_user_a ON friendships(user_a);
CREATE INDEX friendship_user_b ON friendships(user_b);

--

DO $$ BEGIN
	CREATE TYPE valid_difficulty AS ENUM ('NOVICE', 'INTERMEDIATE', 'EXPERT');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE minesweeper (
	id SERIAL PRIMARY KEY,
	score NUMERIC(4,3) NOT NULL,
	difficulty valid_difficulty NOT NULL,
	user_id INT NOT NULL REFERENCES users(id)
);
