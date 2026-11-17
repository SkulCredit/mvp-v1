import { describe, it, mock } from "node:test";
import assert from "node:assert";
import adminService from "../services/admin.service";
import { Parent, School, User, LoanApplication, Disbursement, Repayment } from "../models";
import { SchoolRepository } from "../repositories";
import ApiError from "../utils/apiError";

describe("Admin Deletion Rules", () => {
  describe("deleteParent", () => {
    it("should throw 404 when parent does not exist", async () => {
      mock.method(Parent, "findByPk", async () => null);

      await assert.rejects(
        () => adminService.deleteParent("non-existent-id"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 404);
          assert.strictEqual((err as ApiError).message, "Parent not found");
          return true;
        }
      );
    });

    it("should prevent deletion when parent has loan applications (including historical/repaid)", async () => {
      mock.method(Parent, "findByPk", async () => ({
        id: "p-1",
        userId: "u-1",
      }));
      mock.method(LoanApplication, "findOne", async () => ({
        id: "la-1",
        status: "repaid",
      }));
      mock.method(Disbursement, "findOne", async () => null);
      mock.method(Repayment, "findOne", async () => null);

      await assert.rejects(
        () => adminService.deleteParent("p-1"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 400);
          assert.strictEqual(
            (err as ApiError).message,
            "Cannot delete parent with existing loan applications or financial records"
          );
          return true;
        }
      );
    });

    it("should prevent deletion when parent has disbursement records", async () => {
      mock.method(Parent, "findByPk", async () => ({
        id: "p-2",
        userId: "u-2",
      }));
      mock.method(LoanApplication, "findOne", async () => null);
      mock.method(Disbursement, "findOne", async () => ({ id: "d-1", amount: 1000 }));
      mock.method(Repayment, "findOne", async () => null);

      await assert.rejects(
        () => adminService.deleteParent("p-2"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 400);
          assert.strictEqual(
            (err as ApiError).message,
            "Cannot delete parent with existing loan applications or financial records"
          );
          return true;
        }
      );
    });

    it("should prevent deletion when parent has repayment records", async () => {
      mock.method(Parent, "findByPk", async () => ({
        id: "p-3",
        userId: "u-3",
      }));
      mock.method(LoanApplication, "findOne", async () => null);
      mock.method(Disbursement, "findOne", async () => null);
      mock.method(Repayment, "findOne", async () => ({ id: "r-1", amount: 500 }));

      await assert.rejects(
        () => adminService.deleteParent("p-3"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 400);
          assert.strictEqual(
            (err as ApiError).message,
            "Cannot delete parent with existing loan applications or financial records"
          );
          return true;
        }
      );
    });

    it("should successfully delete parent and user when no loan or financial records exist", async () => {
      let parentDestroyed = false;
      let userDestroyed = false;

      mock.method(Parent, "findByPk", async () => ({
        id: "p-4",
        userId: "u-4",
        destroy: async () => {
          parentDestroyed = true;
        },
      }));
      mock.method(LoanApplication, "findOne", async () => null);
      mock.method(Disbursement, "findOne", async () => null);
      mock.method(Repayment, "findOne", async () => null);
      mock.method(User, "destroy", async () => {
        userDestroyed = true;
      });

      const result = await adminService.deleteParent("p-4");
      assert.deepStrictEqual(result, { id: "p-4" });
      assert.strictEqual(parentDestroyed, true);
      assert.strictEqual(userDestroyed, true);
    });
  });

  describe("deleteSchool", () => {
    it("should throw 404 when school does not exist", async () => {
      mock.method(SchoolRepository, "findById", async () => null);

      await assert.rejects(
        () => adminService.deleteSchool("non-existent-id"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 404);
          assert.strictEqual((err as ApiError).message, "School not found");
          return true;
        }
      );
    });

    it("should prevent deletion when school has associated loan applications (any status)", async () => {
      mock.method(SchoolRepository, "findById", async () => ({
        id: "s-1",
        userId: "u-5",
      }));
      mock.method(LoanApplication, "findOne", async () => ({
        id: "la-2",
        status: "cancelled",
      }));
      mock.method(Disbursement, "findOne", async () => null);

      await assert.rejects(
        () => adminService.deleteSchool("s-1"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 400);
          assert.strictEqual(
            (err as ApiError).message,
            "Cannot delete school with existing loan applications or financial records"
          );
          return true;
        }
      );
    });

    it("should prevent deletion when school has disbursement records", async () => {
      mock.method(SchoolRepository, "findById", async () => ({
        id: "s-2",
        userId: "u-6",
      }));
      mock.method(LoanApplication, "findOne", async () => null);
      mock.method(Disbursement, "findOne", async () => ({ id: "d-2", amount: 50000 }));

      await assert.rejects(
        () => adminService.deleteSchool("s-2"),
        (err: unknown) => {
          assert(err instanceof ApiError);
          assert.strictEqual((err as ApiError).statusCode, 400);
          assert.strictEqual(
            (err as ApiError).message,
            "Cannot delete school with existing loan applications or financial records"
          );
          return true;
        }
      );
    });

    it("should successfully delete school and user when no loan or financial records exist", async () => {
      let schoolDestroyed = false;
      let userDestroyed = false;

      mock.method(SchoolRepository, "findById", async () => ({
        id: "s-3",
        userId: "u-7",
        destroy: async () => {
          schoolDestroyed = true;
        },
      }));
      mock.method(LoanApplication, "findOne", async () => null);
      mock.method(Disbursement, "findOne", async () => null);
      mock.method(User, "destroy", async () => {
        userDestroyed = true;
      });

      const result = await adminService.deleteSchool("s-3");
      assert.deepStrictEqual(result, { id: "s-3" });
      assert.strictEqual(schoolDestroyed, true);
      assert.strictEqual(userDestroyed, true);
    });
  });
});
