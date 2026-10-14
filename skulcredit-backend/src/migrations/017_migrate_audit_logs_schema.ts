import { DataTypes, QueryInterface } from "sequelize";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_STATUSES,
  AUDIT_SEVERITIES,
  AUDIT_ACTOR_ROLES,
} from "../models/AuditLog";

const ENUM_NAMES = ["category", "event_status", "severity", "actor_role"] as const;

const enumTypeName = (col: string) => `enum_audit_logs_${col}`;

async function dropEnumSafely(qi: QueryInterface, col: string): Promise<void> {
  try {
    await qi.sequelize.query(
      `DROP TYPE IF EXISTS "${enumTypeName(col)}" CASCADE;`,
    );
  } catch { /* ignore */ }
}

async function createEnumType(
  qi: QueryInterface,
  col: string,
  values: readonly string[],
): Promise<void> {
  const list = values.map(v => `'${v}'`).join(", ");
  await qi.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${enumTypeName(col)}'
      ) THEN
        CREATE TYPE "${enumTypeName(col)}" AS ENUM (${list});
      END IF;
    END$$;
  `);
}

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("audit_logs")) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
  }
  for (const col of ENUM_NAMES) {
    await dropEnumSafely(queryInterface, col);
  }

  await createEnumType(queryInterface, "category",     AUDIT_CATEGORIES);
  await createEnumType(queryInterface, "event_status", AUDIT_EVENT_STATUSES);
  await createEnumType(queryInterface, "severity",     AUDIT_SEVERITIES);
  await createEnumType(queryInterface, "actor_role",   AUDIT_ACTOR_ROLES);

  await queryInterface.createTable("audit_logs", {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },
    category:     { type: DataTypes.TEXT, allowNull: false },
    action:       { type: DataTypes.STRING(150), allowNull: false },
    event_status: { type: DataTypes.TEXT, allowNull: false },
    severity:     { type: DataTypes.TEXT, allowNull: false, defaultValue: "INFO" },
    actor_id:     { type: DataTypes.STRING(255), allowNull: true },
    actor_role:   { type: DataTypes.TEXT, allowNull: false, defaultValue: "system" },
    method:       { type: DataTypes.STRING(10),  allowNull: true },
    path:         { type: DataTypes.STRING(500), allowNull: true },
    status_code:  { type: DataTypes.INTEGER,     allowNull: true },
    ip_address:   { type: DataTypes.STRING(45),  allowNull: true },
    request_id:   { type: DataTypes.STRING(100), allowNull: true },
    correlation_id: { type: DataTypes.STRING(100), allowNull: true },
    trace_id:     { type: DataTypes.STRING(100), allowNull: true },
    entity_type:  { type: DataTypes.STRING(100), allowNull: true },
    entity_id:    { type: DataTypes.STRING(255), allowNull: true },
    event:        { type: DataTypes.JSONB, allowNull: false },
    actor:        { type: DataTypes.JSONB, allowNull: false },
    request:      { type: DataTypes.JSONB, allowNull: false },
    location:     { type: DataTypes.JSONB, allowNull: true },
    application:  { type: DataTypes.JSONB, allowNull: false },
    resource:     { type: DataTypes.JSONB, allowNull: true },
    navigation:   { type: DataTypes.JSONB, allowNull: true },
    response:     { type: DataTypes.JSONB, allowNull: false },
    error:        { type: DataTypes.JSONB, allowNull: true },
    metadata:     { type: DataTypes.JSONB, allowNull: true },
    created_at: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
  });

  const alterEnum = async (col: string, defaultVal?: string) => {
    if (defaultVal) {
      await queryInterface.sequelize.query(
        `ALTER TABLE audit_logs ALTER COLUMN ${col} DROP DEFAULT;`
      );
    }
    await queryInterface.sequelize.query(`
      ALTER TABLE audit_logs
        ALTER COLUMN ${col} TYPE "${enumTypeName(col)}"
        USING ${col}::"${enumTypeName(col)}";
    `);
    if (defaultVal) {
      await queryInterface.sequelize.query(
        `ALTER TABLE audit_logs ALTER COLUMN ${col} SET DEFAULT '${defaultVal}'::"${enumTypeName(col)}";`
      );
    }
  };
  await alterEnum("category");
  await alterEnum("event_status");
  await alterEnum("severity", "INFO");
  await alterEnum("actor_role", "system");

  await queryInterface.addIndex("audit_logs", ["category"],                 { name: "audit_logs_category_idx"        });
  await queryInterface.addIndex("audit_logs", ["action"],                   { name: "audit_logs_action_idx"          });
  await queryInterface.addIndex("audit_logs", ["event_status"],             { name: "audit_logs_event_status_idx"    });
  await queryInterface.addIndex("audit_logs", ["severity"],                 { name: "audit_logs_severity_idx"        });
  await queryInterface.addIndex("audit_logs", ["actor_id"],                 { name: "audit_logs_actor_id_idx"        });
  await queryInterface.addIndex("audit_logs", ["actor_role"],               { name: "audit_logs_actor_role_idx"      });
  await queryInterface.addIndex("audit_logs", ["method"],                   { name: "audit_logs_method_idx"          });
  await queryInterface.addIndex("audit_logs", ["status_code"],              { name: "audit_logs_status_code_idx"     });
  await queryInterface.addIndex("audit_logs", ["ip_address"],               { name: "audit_logs_ip_address_idx"      });
  await queryInterface.addIndex("audit_logs", ["request_id"],               { name: "audit_logs_request_id_idx"      });
  await queryInterface.addIndex("audit_logs", ["correlation_id"],           { name: "audit_logs_correlation_id_idx"  });
  await queryInterface.addIndex("audit_logs", ["trace_id"],                 { name: "audit_logs_trace_id_idx"        });
  await queryInterface.addIndex("audit_logs", ["entity_type", "entity_id"], { name: "audit_logs_entity_idx"          });
  await queryInterface.addIndex("audit_logs", ["created_at"],               { name: "audit_logs_created_at_idx"      });

  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS "audit_logs_event_gin_idx"    ON audit_logs USING GIN (event);`,
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS "audit_logs_metadata_gin_idx" ON audit_logs USING GIN (metadata);`,
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("audit_logs")) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
  }
  for (const col of ENUM_NAMES) {
    await dropEnumSafely(queryInterface, col);
  }
};
