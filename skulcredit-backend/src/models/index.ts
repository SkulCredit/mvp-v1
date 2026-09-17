import User from "./User";
import Parent from "./Parent";
import Document from "./Document";
import School from "./School";
import Student from "./Student";
import Term from "./Term";
import LoanApplication from "./LoanApplication";
import LoanOffer from "./LoanOffer";
import RepaymentSchedule from "./RepaymentSchedule";
import Repayment from "./Repayment";
import Disbursement from "./Disbursement";
import RefreshToken from "./RefreshToken";
import SchoolRequest from "./SchoolRequest";
import ApplicationEvent from "./ApplicationEvent";
import Notification from "./Notification";
import DeviceToken from "./DeviceToken";

User.hasOne(Parent, { foreignKey: "userId", as: "parentProfile" });
User.hasOne(School, { foreignKey: "userId", as: "schoolProfile" });
User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });

Parent.belongsTo(User, { foreignKey: "userId", as: "user" });
Parent.hasMany(Document, { foreignKey: "parentId", as: "documents" });
Parent.hasMany(Student, { foreignKey: "parentId", as: "students" });
Parent.hasMany(LoanApplication, {
  foreignKey: "parentId",
  as: "loanApplications",
});
Parent.hasMany(SchoolRequest, { foreignKey: "parentId", as: "schoolRequests" });
Parent.hasMany(Repayment, { foreignKey: "parentId", as: "repayments" });
Parent.hasMany(Disbursement, { foreignKey: "parentId", as: "disbursements" });
Parent.hasMany(RepaymentSchedule, {
  foreignKey: "parentId",
  as: "repaymentSchedules",
});

School.belongsTo(User, { foreignKey: "userId", as: "user" });

Document.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
School.hasMany(Student, { foreignKey: "schoolId", as: "students" });
School.hasMany(LoanApplication, {
  foreignKey: "schoolId",
  as: "loanApplications",
});
School.hasMany(Disbursement, { foreignKey: "schoolId", as: "disbursements" });
School.hasMany(Term, { foreignKey: "schoolId", as: "terms" });

Term.belongsTo(School, { foreignKey: "schoolId", as: "school" });
Term.hasMany(LoanApplication, { foreignKey: "termId", as: "loanApplications" });

Student.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
Student.belongsTo(School, { foreignKey: "schoolId", as: "school" });
Student.hasMany(LoanApplication, {
  foreignKey: "studentId",
  as: "loanApplications",
});

LoanApplication.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
LoanApplication.belongsTo(Student, { foreignKey: "studentId", as: "student" });
LoanApplication.belongsTo(School, { foreignKey: "schoolId", as: "school" });
LoanApplication.belongsTo(Term, { foreignKey: "termId", as: "term" });
LoanApplication.hasMany(ApplicationEvent, {
  foreignKey: "loanApplicationId",
  as: "events",
});
LoanApplication.hasOne(LoanOffer, {
  foreignKey: "loanApplicationId",
  as: "offer",
});
LoanApplication.hasMany(RepaymentSchedule, {
  foreignKey: "loanApplicationId",
  as: "schedule",
});
LoanApplication.hasMany(Repayment, {
  foreignKey: "loanApplicationId",
  as: "repayments",
});
LoanApplication.hasOne(Disbursement, {
  foreignKey: "loanApplicationId",
  as: "disbursement",
});

LoanOffer.belongsTo(LoanApplication, {
  foreignKey: "loanApplicationId",
  as: "application",
});

RepaymentSchedule.belongsTo(LoanApplication, {
  foreignKey: "loanApplicationId",
  as: "loanApplication",
});
RepaymentSchedule.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
RepaymentSchedule.hasMany(Repayment, {
  foreignKey: "repaymentScheduleId",
  as: "payments",
});

Repayment.belongsTo(LoanApplication, {
  foreignKey: "loanApplicationId",
  as: "loanApplication",
});
Repayment.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });
Repayment.belongsTo(RepaymentSchedule, {
  foreignKey: "repaymentScheduleId",
  as: "installment",
});

Disbursement.belongsTo(LoanApplication, {
  foreignKey: "loanApplicationId",
  as: "loanApplication",
});
Disbursement.belongsTo(School, { foreignKey: "schoolId", as: "school" });
Disbursement.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });

RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

SchoolRequest.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });

ApplicationEvent.belongsTo(LoanApplication, {
  foreignKey: "loanApplicationId",
  as: "loanApplication",
});

Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

DeviceToken.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(DeviceToken, { foreignKey: "userId", as: "deviceTokens" });

export {
  User,
  Parent,
  Document,
  School,
  Student,
  Term,
  LoanApplication,
  LoanOffer,
  RepaymentSchedule,
  Repayment,
  Disbursement,
  RefreshToken,
  SchoolRequest,
  ApplicationEvent,
  Notification,
  DeviceToken,
};
