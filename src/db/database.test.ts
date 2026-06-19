import { describe, it, expect } from 'vitest';
import { SCHEMA_V1, TABLE_NAMES, SCHEMA_VERSION } from './schema';
import { VacancyDatabase } from './database';

describe('schema constant', () => {
  it('has exactly 9 tables', () => {
    expect(TABLE_NAMES).toHaveLength(9);
  });

  it('includes all required table names', () => {
    expect(TABLE_NAMES).toEqual([
      'jobs',
      'companies',
      'profiles',
      'resumes',
      'coverLetters',
      'applications',
      'events',
      'aiCache',
      'meta',
    ]);
  });

  it('jobs table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.jobs;
    expect(spec).toContain('&id');
    expect(spec).toContain('source');
    expect(spec).toContain('sourceVacancyId');
    expect(spec).toContain('companyId');
    expect(spec).toContain('status');
    expect(spec).toContain('selectedProfileId');
    expect(spec).toContain('firstSeenAt');
    expect(spec).toContain('updatedAt');
    expect(spec).toContain('descriptionHash');
  });

  it('companies table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.companies;
    expect(spec).toContain('&id');
    expect(spec).toContain('sourceCompanyId');
    expect(spec).toContain('name');
    expect(spec).toContain('status');
    expect(spec).toContain('updatedAt');
  });

  it('profiles table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.profiles;
    expect(spec).toContain('&id');
    expect(spec).toContain('name');
    expect(spec).toContain('updatedAt');
  });

  it('resumes table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.resumes;
    expect(spec).toContain('&id');
    expect(spec).toContain('profileId');
    expect(spec).toContain('hhResumeId');
    expect(spec).toContain('updatedAt');
  });

  it('coverLetters table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.coverLetters;
    expect(spec).toContain('&id');
    expect(spec).toContain('jobId');
    expect(spec).toContain('profileId');
    expect(spec).toContain('resumeId');
    expect(spec).toContain('isFinal');
    expect(spec).toContain('updatedAt');
  });

  it('applications table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.applications;
    expect(spec).toContain('&id');
    expect(spec).toContain('jobId');
    expect(spec).toContain('status');
    expect(spec).toContain('appliedAt');
    expect(spec).toContain('updatedAt');
  });

  it('events table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.events;
    expect(spec).toContain('&id');
    expect(spec).toContain('type');
    expect(spec).toContain('jobId');
    expect(spec).toContain('createdAt');
    expect(spec).toContain('sentToN8n');
    expect(spec).toContain('n8nStatus');
  });

  it('aiCache table has primary key id and required indexes', () => {
    const spec = SCHEMA_V1.aiCache;
    expect(spec).toContain('&id');
    expect(spec).toContain('inputHash');
    expect(spec).toContain('kind');
    expect(spec).toContain('provider');
    expect(spec).toContain('model');
    expect(spec).toContain('promptVersion');
    expect(spec).toContain('createdAt');
  });

  it('meta table has primary key only', () => {
    const spec = SCHEMA_V1.meta;
    expect(spec).toBe('&key');
  });

  it('schema version is 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});

describe('VacancyDatabase', () => {
  it('creates instance without opening IndexedDB', () => {
    const instance = new VacancyDatabase();
    expect(instance).toBeInstanceOf(VacancyDatabase);
    expect(instance.name).toBe('VacancyPilotDB');
  });

  it('has typed table accessors defined', () => {
    const instance = new VacancyDatabase();
    // Table accessors exist (Definite Assignment Assertion in class)
    expect(instance.jobs).toBeDefined();
    expect(instance.companies).toBeDefined();
    expect(instance.profiles).toBeDefined();
    expect(instance.resumes).toBeDefined();
    expect(instance.coverLetters).toBeDefined();
    expect(instance.applications).toBeDefined();
    expect(instance.events).toBeDefined();
    expect(instance.aiCache).toBeDefined();
    expect(instance.meta).toBeDefined();
  });
});
