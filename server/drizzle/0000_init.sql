CREATE TYPE "public"."user_role" AS ENUM('patient', 'admin');
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled');
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"specialty" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"slot" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "appointments_doctor_id_idx" ON "appointments" USING btree ("doctor_id");
CREATE INDEX IF NOT EXISTS "appointments_patient_id_idx" ON "appointments" USING btree ("patient_id");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments" USING btree ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_doctor_slot_active_idx" ON "appointments" ("doctor_id", "slot") WHERE status IN ('pending', 'confirmed');
