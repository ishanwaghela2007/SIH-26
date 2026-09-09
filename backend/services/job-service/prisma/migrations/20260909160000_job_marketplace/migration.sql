CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedWorkerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDomain" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "language" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobAssignment_jobId_key" ON "JobAssignment"("jobId");
CREATE INDEX "Job_customerId_status_idx" ON "Job"("customerId", "status");
CREATE INDEX "Job_status_serviceDomain_district_idx" ON "Job"("status", "serviceDomain", "district");
CREATE INDEX "Job_assignedWorkerId_status_idx" ON "Job"("assignedWorkerId", "status");
CREATE INDEX "JobAssignment_workerId_acceptedAt_idx" ON "JobAssignment"("workerId", "acceptedAt");

ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
