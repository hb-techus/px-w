import React, { lazy, Suspense } from "react";


// auth Module
const Login = lazy(() => import("../../components/auth/pages/LoginForm"));
const ForgetPassword = lazy(
  () => import("../../components/auth/pages/ForgetPassword"),
);
const ResetPassword = lazy(
  () => import("../../components/auth/pages/ResetPassword"),
);
const TwoFactorAuthenticate = lazy(
  () => import("../../components/auth/pages/TwoFactorAuth"),
);
const ActivateAccount = lazy(
  () => import("../../components/auth/pages/ActivateAccount"),
);

// projects module
const Projects = lazy(
  () => import("../../components/InnerPages/ProjectsModule/Projects"),
);
const CreateProject = lazy(
  () => import("../../components/InnerPages/ProjectsModule/CreateProject"),
);
const ProjectLayout = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ProjectLayout.js"),
);

// products module
const Products = lazy(
  () => import("../../components/InnerPages/ProjectsModule/Products.js"),
);
const OrganizationProducts = lazy(
  () => import("../../components/InnerPages/ProjectsModule/Products.js"),
);
const LaborCost = lazy(
  () => import("../../components/InnerPages/ProjectsModule/LaborCost.js"),
);
const CreateLaborCost = lazy(
  () => import("../../components/InnerPages/ProjectsModule/CreateLaborCost.js"),
);
const CreateProduct = lazy(
  () => import("../../components/InnerPages/ProjectsModule/CreateProduct"),
);
const ProductLayout = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ProductLayout.js"),
);
const ViewProduct = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ViewProduct.js"),
);
const ViewLaborCost = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ViewLaborCost.js"),
);

// setings
const Settings = lazy(() => import("../../components/InnerPages/Settings/SettingsLayout.js"));

// roles
const RolesAndPermissions = lazy(
  () => import("../../components/InnerPages/RoleLayout.js"),
);
const NewRoleForm = lazy(
  () =>
    import("../../components/InnerPages/RolesAndPermissions/RolesPermissionForm.js"),
);
const RolesPermissionTable = lazy(
  () =>
    import("../../components/InnerPages/RolesAndPermissions/RolesPermissionTable.js"),
);
const ViewRole = lazy(
  () =>
    import("../../components/InnerPages/RolesAndPermissions/ViewRolePage.js"),
);

// user module pages
const AdminUsers = lazy(() => import("../../components/InnerPages/AdminUsers"));
const UserForm = lazy(
  () => import("../../components/InnerPages/UserModule/UserForm"),
);

const OrgView = lazy(
  () => import("../../components/InnerPages/UserModule/ViewUserDrawer.js"),
);
const ProfileLayout = lazy(
  () => import("../../components/InnerPages/UserModule/ProfileLayout"),
);

// under development
const UnderDevelopment = lazy(
  () => import("../../components/Common/UnderDevelopment"),
);

//
const OrganizationList = lazy(
  () => import("../../components/InnerPages/OrganizationList"),
);
const AddOrganizationLayout = lazy(
  () =>
    import("../../components/InnerPages/Agency/AddOrganization/AddOrganization.js"),
);
const OrganizationView = lazy(
  () => import("../../components/InnerPages/Agency/OrganizationView.js"),
);

const OrganizationProjects = lazy(
  () =>
    import("../../components/InnerPages/ProjectsModule/OrganizationProjects.js"),
);
const OrganizationUsers = lazy(
  () => import("../../components/InnerPages/UserModule/OrganizationUsers.js"),
);
//adminuser
const AdminList = lazy(
  () => import("../../components/InnerPages/Admin/AdminList.js"),
);
const AdminCreateUser = lazy(
  () => import("../../components/InnerPages/Admin/CreateUserForm.js"),
);
const AdminViewUser = lazy(
  () => import("../../components/InnerPages/Admin/AdminViewUser.js"),
);

//packages
const PackageList = lazy(
  () => import("../../components/InnerPages/Packages/PackageList.js"),
);
const CreatePackage = lazy(
  () => import("../../components/InnerPages/Packages/CreatePackage.js"),
);
const ViewPackage = lazy(
  () => import("../../components/InnerPages/Packages/ViewPackage.js"),
);

//Company Knowledge

const ProposalDrafting = lazy(
  () =>
    import("../../components/InnerPages/CompanyKnowledge/ProposalDrafting.js"),
);
const ProposalDocument = lazy(
  () =>
    import("../../components/InnerPages/CompanyKnowledge/ProposalDocument.js"),
);
const ProposalProgress = lazy(
  () =>
    import("../../components/InnerPages/CompanyKnowledge/ProposalProgress.js"),
);
const ProposalView = lazy(
  () => import("../../components/InnerPages/CompanyKnowledge/ProposalView.js"),
);
const ProcessingModel = lazy(
  () =>
    import("../../components/InnerPages/CompanyKnowledge/ProcessingModel.js"),
);
// AI inner pages

// RFP
const RFPOverview = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/RFPOverview"),
);
const BidScore = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/BidScore.js"),
);
const AdvisorRfp = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/AdvisorRfp.js"),
);
const AnalysisRfp = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/AnalysisRfp.js"),
);
const RiskRfp = lazy(
  () => import("../../components/InnerPages/ConAiModule/RFPComponents/RiskRfp"),
);
const GapRfp = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/GapRfp.js"),
);
const CoPilotRfp = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/CoPilotRfp.js"),
);
const RFPDocument = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFPComponents/RFPDocument.js"),
);

// takeoff
const TakeoffOverview = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/TakeoffComponents/TakeoffOverview.js"),
);
const TakeoffWorkspace = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/TakeoffComponents/TakeoffWorkspace.js"),
);
const TakeoffDocument = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/TakeoffComponents/TakeoffDocument.js"),
);




const RFILayoutComp = lazy(
  () => import("../../components/InnerPages/ConAiModule/RFIDrafter/RFILayout"),
);
const RFIDrafterTable = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFIDrafter/RFIDrafterTableLayout"),
);
const GenerateRFI = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFIDrafter/GeneratedRFIDocument/GenerateRFILayout"),
);
const CreateRFI = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/RFIDrafter/CreateRFIDrafter/CreateRFILayout"),
);

// Bid Invite
const BidInvite = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/BidInvite/BidInviteLayout"),
);
const BidInviteTable = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/BidInvite/BitInviteTable"),
);
const BidCreate = lazy(
  () => import("../../components/InnerPages/ConAiModule/BidInvite/CreateBid"),
);
const BidInviteForCompany = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/BidInvite/BidInviteForCompany/BidInviteForCompanyLayout"),
);

// health checker

const HealthCheckerTable = lazy(() => import("../../components/InnerPages/ConAiModule/ContractCommand/HealthCheckerTable"),);
const NewHealthChecker   = lazy(() => import("../../components/InnerPages/ConAiModule/ContractCommand/Newhealthchecker"),);
const ContractHealthReport = lazy(
  () => import("../../components/InnerPages/ConAiModule/ContractCommand/ContractHealthReport"),
);

const ContractHealthAnalysis = lazy(
  () => import("../../components/InnerPages/ConAiModule/ContractCommand/Checkerloader.js"),
);

// Estimator
const EstimatorOverview = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/EstimationOverview.js"),
);
const MaterialEstimation = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/MaterialEstimation.js"),
);
const LaborEstimation = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/LaborEstimation.js"),
);
const EstimatorWhatIf = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/WhatIfStimulator.js"),
);
const ROICalculator = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/ROICalculator.js"),
);
const ROIDasboard = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/ROIDashboard.js"),
);
const ROIContext = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/EstimatorComponents/ROIContext.js"),
);


//Estimator


const DrafterList = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/AIDrafter/DrafterList.js"),
);
const CreateDrafter = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/AIDrafter/CreateDrafter.js"),
);
const PreviewDrafter = lazy(
  () =>
    import("../../components/InnerPages/ConAiModule/AIDrafter/AIDrafterProposalPreview.js"),
);

//

const ClauseSuggestertList=lazy(()=>import('../../components/InnerPages/ConAiModule/ClauseSuggester/ClauseList.js'))

const CreateClauseSuggester=lazy(()=>import('../../components/InnerPages/ConAiModule/ClauseSuggester/CreateClauseSuggester.js'))

const AnalysisContract=lazy(()=>import('../../components/InnerPages/ConAiModule/ClauseSuggester/AnalysisClause.js'))

const AnalysisResult=lazy(()=>import('../../components/InnerPages/ConAiModule/ClauseSuggester/AnalysisResult.js'))


//
const LaborCrew = lazy(
  () => import("../../components/InnerPages/ProjectsModule/LaborCrew.js"),
);
const LaborMember = lazy(
  () => import("../../components/InnerPages/ProjectsModule/LaborMember.js"),
);
const ViewCrew = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ViewCrew.js"),
);
const CreateMember = lazy(
  () => import("../../components/InnerPages/ProjectsModule/CreateMember.js"),
);
const ViewMember = lazy(
  () => import("../../components/InnerPages/ProjectsModule/ViewMember.js"),
);

// audit logs
const AuditLogs = lazy(
  () => import("../../components/InnerPages/AuditLogs/AuditLogs.js"),
);

// Fallback component for Suspense
const Loading = () => <div>{/* <Loader /> */}</div>; // Assuming RedLoader is an existing loader component

// authentication routes
const LoginPage = () => (
  <Suspense fallback={<Loading />}>
    <Login />
  </Suspense>
);

const ForgetPasswordPage = () => (
  <Suspense fallback={<Loading />}>
    <ForgetPassword />
  </Suspense>
);

const ResetPasswordPage = () => (
  <Suspense fallback={<Loading />}>
    <ResetPassword />
  </Suspense>
);

const TwoFactorAuthenticatePage = () => (
  <Suspense fallback={<Loading />}>
    <TwoFactorAuthenticate />
  </Suspense>
);

const ActivateAccountPage = () => (
  <Suspense fallback={<Loading />}>
    <ActivateAccount />
  </Suspense>
);

// inner main pages routes

const SettingsPage = () => (
  <Suspense fallback={<Loading />}>
    <Settings />
  </Suspense>
);

const AdminUsersPage = () => (
  <Suspense fallback={<Loading />}>
    <AdminUsers />
  </Suspense>
);

//
const ProjectsListPage = () => (
  <Suspense fallback={<Loading />}>
    <Projects />
  </Suspense>
);

const CreateProjectPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateProject />
  </Suspense>
);

const ProjectLayoutPage = () => (
  <Suspense fallback={<Loading />}>
    <ProjectLayout />
  </Suspense>
);

//
const ProductsPage = () => (
  <Suspense fallback={<Loading />}>
    <Products />
  </Suspense>
);
const OrganizationProductsPage = () => (
  <Suspense fallback={<Loading />}>
    <OrganizationProducts />
  </Suspense>
);

const CreateProductPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateProduct />
  </Suspense>
);

const ViewProductPage = () => (
  <Suspense fallback={<Loading />}>
    <ViewProduct />
  </Suspense>
);

const ViewLaborCostPage = () => (
  <Suspense fallback={<Loading />}>
    <ViewLaborCost />
  </Suspense>
);

const ProductLayoutPage = () => (
  <Suspense fallback={<Loading />}>
    <ProductLayout />
  </Suspense>
);

const LaborCostPage = () => (
  <Suspense fallback={<Loading />}>
    <LaborCost />
  </Suspense>
);

const CreateLaborCostPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateLaborCost />
  </Suspense>
);

// Users Module
const UserFormPage = () => (
  <Suspense fallback={<Loading />}>
    <UserForm />
  </Suspense>
);

const OrgViewPage = () => (
  <Suspense fallback={<Loading />}>
    <OrgView />
  </Suspense>
);

const ProfileLayoutPage = () => (
  <Suspense fallback={<Loading />}>
    <ProfileLayout />
  </Suspense>
);

// UnderDevelopment
const UnderDevelopmentPage = () => (
  <Suspense fallback={<Loading />}>
    <UnderDevelopment />
  </Suspense>
);

// Ai inner pages

// RFP
const RFPOverviewPage = () => (
  <Suspense fallback={<Loading />}>
    <RFPOverview />
  </Suspense>
);

const AdvisorRfpPage = () => (
  <Suspense fallback={<Loading />}>
    <AdvisorRfp />
  </Suspense>
);

const AnalysisRfpPage = () => (
  <Suspense fallback={<Loading />}>
    <AnalysisRfp />
  </Suspense>
);

const RiskRfpPage = () => (
  <Suspense fallback={<Loading />}>
    <RiskRfp />
  </Suspense>
);

const GapRfpPage = () => (
  <Suspense fallback={<Loading />}>
    <GapRfp />
  </Suspense>
);

const CoPilotRfpPage = () => (
  <Suspense fallback={<Loading />}>
    <CoPilotRfp />
  </Suspense>
);

const RFPDocumentPage = () => (
  <Suspense fallback={<Loading />}>
    <RFPDocument />
  </Suspense>
);
const BidScorePage = () => (
  <Suspense fallback={<Loading />}>
    <BidScore />
  </Suspense>
);

// RFI
const RFILayoutPage = () => (
  <Suspense fallback={<Loading />}>
    <RFILayoutComp />
  </Suspense>
);

const RFIDrafterTablePage = () => (
  <Suspense fallback={<Loading />}>
    <RFIDrafterTable />
  </Suspense>
);

const GenerateRFIPage = () => (
  <Suspense fallback={<Loading />}>
    <GenerateRFI />
  </Suspense>
);

const CreateRFIPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateRFI />
  </Suspense>
);

// Bid Invite
const BidInviteLayoutPage = () => (
  <Suspense fallback={<Loading />}>
    <BidInvite />
  </Suspense>
);

const BidInviteTablePage = () => (
  <Suspense fallback={<Loading />}>
    <BidInviteTable />
  </Suspense>
);

const CreateBidPage = () => (
  <Suspense fallback={<Loading />}>
    <BidCreate />
  </Suspense>
);

const BidInviteForCompanyPage = () => (
  <Suspense fallback={<Loading />}>
    <BidInviteForCompany />
  </Suspense>
);

// health checker 
const HealthCheckerTablePage = () => (
  <Suspense fallback={<Loading />}>
    <HealthCheckerTable />
  </Suspense>
);

const NewHealthCheckerPage = () => (
  <Suspense fallback={<Loading />}>
    <NewHealthChecker />
  </Suspense>
);

const ContractHealthReportPage = () => (
  <Suspense fallback={<Loading />}>
    <ContractHealthReport />
  </Suspense>
);



const AnalysisPage = () => (
  <Suspense fallback={<Loading />}>
    <ContractHealthAnalysis  />
  </Suspense>
);

// takeoff
const TakeoffDocumentPage = () => (
  <Suspense fallback={<Loading />}>
    <TakeoffDocument />
  </Suspense>
);

const TakeoffOverviewPage = () => (
  <Suspense fallback={<Loading />}>
    <TakeoffOverview />
  </Suspense>
);
const TakeoffWorkspacePage = () => (
  <Suspense fallback={<Loading />}>
    <TakeoffWorkspace />
  </Suspense>
);

//
const EstimatorOverviewPage = () => (
  <Suspense fallback={<Loading />}>
    <EstimatorOverview />
  </Suspense>
);

const MaterialEstimationPage = () => (
  <Suspense fallback={<Loading />}>
    <MaterialEstimation />
  </Suspense>
);

const LaborEstimationPage = () => (
  <Suspense fallback={<Loading />}>
    <LaborEstimation />
  </Suspense>
);

const EstimatorWhatIfPage = () => (
  <Suspense fallback={<Loading />}>
    <EstimatorWhatIf />
  </Suspense>
);

const ROICalculatorPage = () => (
  <Suspense fallback={<Loading />}>
    <ROICalculator />
  </Suspense>
);

const ROIDashboardPage = () => (
  <Suspense fallback={<Loading />}>
    <ROIDasboard />
  </Suspense>
);

const ROIProviderPage = () => (
  <Suspense fallback={<Loading />}>
    <ROIContext />
  </Suspense>
);

// Roles
const RolesAndPermissionsPage = () => (
  <Suspense fallback={<Loading />}>
    <RolesAndPermissions />
  </Suspense>
);

const NewRolesFormPage = () => (
  <Suspense fallback={<Loading />}>
    <NewRoleForm />
  </Suspense>
);

const RolesPermissionTablePage = () => (
  <Suspense fallback={<Loading />}>
    <RolesPermissionTable />
  </Suspense>
);

const ViewRolePage = () => (
  <Suspense fallback={<Loading />}>
    <ViewRole />
  </Suspense>
);

// Organization
const OrganizationsPage = () => (
  <Suspense fallback={<Loading />}>
    <OrganizationList />
  </Suspense>
);
const AddOrganizationPage = () => (
  <Suspense fallback={<Loading />}>
    <AddOrganizationLayout />
  </Suspense>
);

const OrganizationViewPage = () => (
  <Suspense fallback={<Loading />}>
    <OrganizationView />
  </Suspense>
);

//AI DRAFTER
const DrafterListPage = () => (
  <Suspense fallback={<Loading />}>
    <DrafterList />
  </Suspense>
);

const CreateDrafterPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateDrafter />
  </Suspense>
);

const PreviewDrafterPage = () => (
  <Suspense fallback={<Loading />}>
    <PreviewDrafter />
  </Suspense>
);

const ClauseSuggesterPage = () => (
  <Suspense fallback={<Loading />}>
    <ClauseSuggestertList />
  </Suspense>
);

const CreateClauseSuggesterPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateClauseSuggester />
  </Suspense>
);

const AnalysisResultPage = () => (
  <Suspense fallback={<Loading />}>
    <AnalysisResult/>
  </Suspense>
);



const AnalyzingClausesPage = () => (
  <Suspense fallback={<Loading />}>
    <AnalysisContract />
  </Suspense>
);



// const OrganizationViewPage = () => (
//   <Suspense fallback={<Loading />}>
//     <OrganizationView />
//   </Suspense>
// );

const AdminListPage = () => (
  <Suspense fallback={<Loading />}>
    <AdminList />
  </Suspense>
);

const AdminCreateUserPage = () => (
  <Suspense fallback={<Loading />}>
    <AdminCreateUser />
  </Suspense>
);
const AdminviewPage = () => (
  <Suspense fallback={<Loading />}>
    <AdminViewUser />
  </Suspense>
);
const PackageListPage = () => (
  <Suspense fallback={<Loading />}>
    <PackageList />
  </Suspense>
);
const CreatePackagePage = () => (
  <Suspense fallback={<Loading />}>
    <CreatePackage />
  </Suspense>
);

const ViewPackagePage = () => (
  <Suspense fallback={<Loading />}>
    <ViewPackage />
  </Suspense>
);
//
const ProposalDraftingPage = () => (
  <Suspense fallback={<Loading />}>
    <ProposalDrafting />
  </Suspense>
);

const ProposalDocumentPage = () => (
  <Suspense fallback={<Loading />}>
    <ProposalDocument />
  </Suspense>
);

const ProposalProgressPage = () => (
  <Suspense fallback={<Loading />}>
    <ProposalProgress />
  </Suspense>
);

const ProposalViewPage = () => (
  <Suspense fallback={<Loading />}>
    <ProposalView />
  </Suspense>
);

const ProposalModelPage = () => (
  <Suspense fallback={<Loading />}>
    <ProcessingModel />
  </Suspense>
);

const OrganizationProjectsList = () => (
  <Suspense fallback={<Loading />}>
    <OrganizationProjects />
  </Suspense>
);

const OrganizationUsersList = () => (
  <Suspense fallback={<Loading />}>
    <OrganizationUsers />
  </Suspense>
);


// 

const LaborCrewPage = () => (
  <Suspense fallback={<Loading />}>
    <LaborCrew />
  </Suspense>
);

const ViewCrewPage = () => (
  <Suspense fallback={<Loading />}>
    <ViewCrew />
  </Suspense>
);

const LaborMemberPage = () => (
  <Suspense fallback={<Loading />}>
    <LaborMember />
  </Suspense>
);

const CreateMemberPage = () => (
  <Suspense fallback={<Loading />}>
    <CreateMember />
  </Suspense>
);

const ViewMemberPage = () => (
  <Suspense fallback={<Loading />}>
    <ViewMember />
  </Suspense>
);

const AuditLogsPage = () => (
  <Suspense fallback={<Loading />}>
    <AuditLogs />
  </Suspense>
);

export {
  // authentication
  LoginPage,
  ForgetPasswordPage,
  ResetPasswordPage,
  TwoFactorAuthenticatePage,
  ActivateAccountPage,

  // innerpages
  SettingsPage,
  AdminUsersPage,
  OrgViewPage,

  //
  ProjectsListPage,
  CreateProjectPage,
  ProjectLayoutPage,
  OrganizationProjectsList,
  OrganizationUsersList,
  //
  ProductsPage,
  OrganizationProductsPage,
  CreateProductPage,
  ProductLayoutPage,
  ViewProductPage,
  ViewLaborCostPage,
  LaborCostPage,
  CreateLaborCostPage,

  // roles
  RolesAndPermissionsPage,
  NewRolesFormPage,
  RolesPermissionTablePage,
  ViewRolePage,
  OrganizationsPage,
  AddOrganizationPage,
  OrganizationViewPage,
  AdminListPage,
  AdminCreateUserPage,
  AdminviewPage,
  //packages
  PackageListPage,
  CreatePackagePage,
  ViewPackagePage,
  //
  RFPOverviewPage,
  BidScorePage,
  AdvisorRfpPage,
  AnalysisRfpPage,
  RiskRfpPage,
  GapRfpPage,
  CoPilotRfpPage,
  RFPDocumentPage,
  //
  TakeoffDocumentPage,
  TakeoffOverviewPage,
  TakeoffWorkspacePage,

  //
  EstimatorOverviewPage,
  MaterialEstimationPage,
  LaborEstimationPage,
  EstimatorWhatIfPage,
  ROICalculatorPage,
  ROIDashboardPage,
  ROIProviderPage,
  //
  RFILayoutPage,
  RFIDrafterTablePage,
  GenerateRFIPage,
  CreateRFIPage,
  BidInviteLayoutPage,
  BidInviteTablePage,
  CreateBidPage,
  BidInviteForCompanyPage,
  HealthCheckerTablePage,
NewHealthCheckerPage,
 ContractHealthReportPage, 
AnalysisPage,
  DrafterListPage,
  CreateDrafterPage,
  PreviewDrafterPage,

  // users module
  UserFormPage,
  ProfileLayoutPage,
  //
  ClauseSuggesterPage,
  CreateClauseSuggesterPage,
AnalyzingClausesPage,
AnalysisResultPage,

  //
  ProposalDraftingPage,
  ProposalDocumentPage,
  ProposalProgressPage,
  ProposalViewPage,
  ProposalModelPage,
  LaborCrewPage,
  LaborMemberPage,
  ViewCrewPage,
  CreateMemberPage,
  ViewMemberPage,
  AuditLogsPage,
  //
  UnderDevelopmentPage,
};
