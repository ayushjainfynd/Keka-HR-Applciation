import { EntitySchema } from 'typeorm';

export const EmployeeData = new EntitySchema({
    name: 'EmployeeData',
    columns: {
        keka_id: {
            primary: true,
            type: 'varchar',
            nullable: false,
        },
        keka_joining_date: {
            type: 'timestamp',
            nullable: false,
        },
        keka_display_name: {
            type: 'varchar',
            nullable: false,
        },
        keka_emp_email: {
            type: 'varchar',
            nullable: false,
        },
        keka_business_unit: {
            type: 'varchar',
            nullable: false,
        },
        keka_department: {
            type: 'varchar',
            nullable: false,
        },
        keka_job_title: {
            type: 'varchar',
            nullable: false,
        },
        keka_office_location: {
            type: 'varchar',
            nullable: false,
        },
        keka_resignation_submitted_date: {
            type: 'timestamp',
            nullable: true,
        },
        keka_exit_status: {
            type: 'int',
            nullable: true,
        },
        keka_exit_date: {
            type: 'timestamp',
            nullable: true,
        },
        keka_reporting_manager_name: {
            type: 'varchar',
            nullable: true,
        },
        keka_reporting_manager_email: {
            type: 'varchar',
            nullable: true,
        },
        keka_employment_status: {
            type: 'int',
            nullable: false,
        },
        keka_exit_type: {
            type: 'int',
            nullable: true,
        },
        keka_exit_reason: {
            type: 'varchar',
            nullable: true,
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,  // Automatically set on creation
        },
        updatedAt: {
            type: 'timestamp',
            updateDate: true,  // Automatically updated on modification
        },
    },
});
