/***************************************************************************************
 * @module       Main Routes
 * @name         techus-mainRoutes
 * @description  Main application router configuration with authentication and protected routes
 * @version      1.0.0
 * @license      Licensed under the MIT License
 * @createdon    October 2025
 * @since        1.0
 ***************************************************************************************/

import React from "react";
import { createHashRouter, Navigate } from "react-router-dom";
import AdminAuthLayout from "@/components/auth/layout/AdminAuthLayout.js";
import UnAuthRoute from "../utils/techus-UnautherizedRouteUtils";
import DynamicAuthLayout from "@/components/auth/layout/DynamicAuthLayout.js";
import { SessionHandler } from "../axois/SessionHandler";
import Layout from "@/components/Common/Layout.js";
import {
  LoginPage,
  ForgetPasswordPage,
  ResetPasswordPage,
  ProjectsListPage,
  ProductsPage,
  ProductLayoutPage,
  LaborCostPage,
  CreateLaborCostPage,
  CreateProductPage,
  RFPOverviewPage,
  AdvisorRfpPage,
  AnalysisRfpPage,
  RiskRfpPage,
  GapRfpPage,
  RFPDocumentPage,
  CoPilotRfpPage,
  CreateProjectPage,
  ProjectLayoutPage,
  // SettingsPage,
  RolesAndPermissionsPage,
  RolesPermissionTablePage,
  NewRolesFormPage,
  ViewRolePage,
  OrganizationsPage,
  TwoFactorAuthenticatePage,
  ActivateAccountPage,
  RFILayoutPage,
  RFIDrafterTablePage,
  GenerateRFIPage,
  CreateRFIPage,
  BidInviteLayoutPage,
  BidInviteTablePage,
  CreateBidPage,
  BidInviteForCompanyPage,
  // * Takeoff  *
  TakeoffDocumentPage,
  TakeoffOverviewPage,
  TakeoffWorkspacePage,
  //    * estimator *
  EstimatorOverviewPage,
  LaborEstimationPage,
  MaterialEstimationPage,
  EstimatorWhatIfPage,
  ROICalculatorPage,
  ROIDashboardPage,
  ROIProviderPage,
  AdminListPage,
  AdminCreateUserPage,
  AdminviewPage,
  PackageListPage,
  CreatePackagePage,
  ViewPackagePage,
  ProposalDraftingPage,
  ProposalDocumentPage,
  ProposalProgressPage,
  ProposalViewPage,
  ProposalModelPage,
  DrafterListPage,
  CreateDrafterPage,
  AdminUsersPage,
  UserFormPage,
  OrgViewPage,
  AddOrganizationPage,
  OrganizationViewPage,
  OrganizationProjectsList,
  OrganizationUsersList,
  // ProfileLayoutPage,
  ViewProductPage,
  ViewLaborCostPage,
  PreviewDrafterPage,
  ClauseSuggesterPage,
  CreateClauseSuggesterPage,
  BidScorePage,
  AnalyzingClausesPage,
  AnalysisResultPage,
  HealthCheckerTablePage,
  NewHealthCheckerPage,
  ContractHealthReportPage,
  AnalysisPage,
  SettingsPage,
  LaborCrewPage,
  LaborMemberPage,
  ViewCrewPage,
  CreateMemberPage,
  ViewMemberPage,
  AuditLogsPage
} from "./optimisedRoutes/techus-lazyRoutes";
import ProtectedRoute from "../utils/techus-ProtectedRouteUtils";
import userRoutes from "./techus-userRoutes";
import UnderDevelopment from "../components/Common/UnderDevelopment";
import { TakeoffProvider } from "../components/InnerPages/ConAiModule/TakeoffComponents/TakeoffContext";
import PermissionGuard from "./PermissionGuard";
import AccessDenied from "../genriccomponents/AccessDenied";
import AdminPortalEntryRedirect from "./AdminPortalEntryRedirect";
import PackageRestricted from "../genriccomponents/PackageRestricted";
import OrgPermissionGuard from "./orgPermissionGuard";
import OrgPortalEntryRedirect from "./orgPortalEntryRedirect";

const router = createHashRouter([
  /*********************************************************
   * ORGANIZATION PORTAL – UNAUTHENTICATED
   *********************************************************/
  {
    path: "",
    element: (
      <UnAuthRoute portal="organization">
        <SessionHandler portal="organization" />
        <DynamicAuthLayout />
      </UnAuthRoute>
    ),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgetPasswordPage /> },
      { path: "reset_password", element: <ResetPasswordPage /> },
      {
        path: "two-factor-authentication",
        element: <TwoFactorAuthenticatePage />,
      },
      { path: "activate", element: <ActivateAccountPage /> },
    ],
  },

  /*********************************************************
   * ORGANIZATION PORTAL – PROTECTED
   *********************************************************/
  {
    path: "",
    element: (
      <ProtectedRoute portal="organization">
        <SessionHandler portal="organization" />
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      ...userRoutes,
      { index: true, element: <OrgPortalEntryRedirect /> },


      /******** PROJECTS ********/
    {
  path: "projects",
  element: (
    <OrgPermissionGuard packageKey="projects">
      <ProjectLayoutPage />
    </OrgPermissionGuard>
  ),
  children: [
    { index: true, element: <ProjectsListPage /> },
    { path: "create", element: <CreateProjectPage /> },
    { path: "update/:id", element: <CreateProjectPage /> },
  ],
},

      //organization user
      {
        path: "users",
        children: [
          {
            index: true,
            element: (
              <OrgPermissionGuard packageKey="users" module="user_management" permission="view">
                <AdminUsersPage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <OrgPermissionGuard packageKey="users" module="user_management" permission="add">
                <UserFormPage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "update/:id?",
            element: (
              <OrgPermissionGuard packageKey="users" module="user_management" permission="edit">
                <UserFormPage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "view/:id?",
            element: (
              <OrgPermissionGuard packageKey="users" module="user_management" permission="view">
                <OrgViewPage />
              </OrgPermissionGuard>
            ),
          },
        ],
      },
      {
        path: "knowledge-base",
        children: [
          {
            index: true,
            element: (
              <OrgPermissionGuard packageKey="org_kb" module="company_knowledge_management" permission="view">
                <ProposalDraftingPage />
              </OrgPermissionGuard>
            )
          },
          {
            path: "upload",
            element:
              (
                <OrgPermissionGuard packageKey="org_kb" module="company_knowledge_management" permission="upload">
                  <ProposalDocumentPage />
                </OrgPermissionGuard>
              )
          },
          {
            path: "progress",
            element:
              (
                <OrgPermissionGuard packageKey="org_kb" module="company_knowledge_management" permission="upload">
                  <ProposalProgressPage />
                </OrgPermissionGuard>
              )
          },
          {
            path: "preview",
            element:
              (
                <OrgPermissionGuard packageKey="org_kb" module="company_knowledge_management" permission="view">
                  <ProposalViewPage />
                </OrgPermissionGuard>
              )
          },
          { path: "process", element: <ProposalModelPage /> },
        ],
      },
      {
        path: "project/view/:uuid",
        element: <ProjectLayoutPage />,
        children: [

          { path: "restricted", element: <AccessDenied /> },
          { path: "restricted-package", element: <PackageRestricted /> },

          /******** BID INTELLIGENCE ********/
          {
            path: "bid-intelligence",
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                path: "dashboard",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="bid_dashboard" module="bid_dashboard" permission="view">
                    <RFPOverviewPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "bid-score",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="bid_score" module="bid_score" permission="view">
                    <BidScorePage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "win-strategist",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="win_strategist" module="win_strategist" permission="view">
                    <AdvisorRfpPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "requirement-extractor",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="req_extractor" module="requirement_extractor" permission="view">
                    <AnalysisRfpPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "risk-radar",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="risk_radar" module="risk_radar" permission="view">
                    <RiskRfpPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "scope-gap-finder",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="scope_gap" module="scope_gap_finder" permission="view">
                    <GapRfpPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "bid-advisor",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="bid_advisor" module="bid_advisor" permission="view">
                    <CoPilotRfpPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "rfp-files",
                element: (
                  <OrgPermissionGuard parentPackageKey="bid_intelligence" packageKey="rfp_file_mgr" module="rfp_file_manager" permission="view">
                    <RFPDocumentPage />
                  </OrgPermissionGuard>
                ),
              },
            ],
          },

          /******** TAKEOFF ENGINE ********/
          {
            path: "takeoff-engine",
            element: <TakeoffProvider />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                path: "dashboard",
                element: (
                  <OrgPermissionGuard parentPackageKey="takeoff_engine" packageKey="takeoff_dash" module="takeoff_dashboard" permission="view">
                    <TakeoffOverviewPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "plan-studio",
                element: (
                  <OrgPermissionGuard parentPackageKey="takeoff_engine" packageKey="takeoff_dash" module="takeoff_dashboard" permission="view">
                    <TakeoffWorkspacePage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "plan-studio/:documentId",
                element: (
                  <OrgPermissionGuard parentPackageKey="takeoff_engine" packageKey="takeoff_dash" module="takeoff_dashboard" permission="view">
                    <TakeoffWorkspacePage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "plan-files",
                element: (
                  <OrgPermissionGuard parentPackageKey="takeoff_engine" packageKey="plan_file_mgr" module="plan_file_manager" permission="view">
                    <TakeoffDocumentPage />
                  </OrgPermissionGuard>
                ),
              },
            ],
          },


          /******** ESTIMATE BUILDER ********/
          {
            path: "estimate-builder",
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                path: "dashboard",
                element: (
                  <OrgPermissionGuard parentPackageKey="estimate_builder" packageKey="est_dash" module="estimation_dashboard" permission="view">
                    <EstimatorOverviewPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "material-estimation",
                element: (
                  <OrgPermissionGuard parentPackageKey="estimate_builder" packageKey="mat_est" module="material_estimation" permission="view">
                    <MaterialEstimationPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "labor-estimation",
                element: (
                  <OrgPermissionGuard parentPackageKey="estimate_builder" packageKey="mat_est" module="material_estimation" permission="view">
                    <LaborEstimationPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "what-if-modeler",
                element: (
                  <OrgPermissionGuard parentPackageKey="estimate_builder" packageKey="whatif" module="what_if_modeler" permission="view">
                    <EstimatorWhatIfPage />
                  </OrgPermissionGuard>
                ),
              },

            ],
          },

          /******** CONTRACT COMMAND ********/
          {
            path: "contract-command",
            children: [
              { index: true, element: <Navigate to="proposal-drafter" replace /> },

              /*** Proposal Drafter ***/
              {
                path: "proposal-drafter",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="proposal_drafter"
                    module="proposal_drafter"
                    permission="view"
                  >
                    <DrafterListPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "proposal-drafter/add",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="proposal_drafter"
                    module="proposal_drafter"
                    permission="create_draft"
                  >
                    <CreateDrafterPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "proposal-drafter/update/:drafter_uuid",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="proposal_drafter"
                    module="proposal_drafter"
                    permission="edit"
                  >
                    <CreateDrafterPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "proposal-drafter/view/:drafter_uuid",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="proposal_drafter"
                    module="proposal_drafter"
                    permission="view"
                  >
                    <PreviewDrafterPage />
                  </OrgPermissionGuard>
                ),
              },

              /*** RFI Drafter ***/
              {
                path: "rfi-drafter",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="rfi_drafter"
                    module="rfi_drafter"
                    permission="view"
                  >
                    <RFILayoutPage />
                  </OrgPermissionGuard>
                ),
                children: [
                  { index: true, element: <RFIDrafterTablePage /> },
                  { path: "add/:rfi_drafter_uuid?", element: <CreateRFIPage /> },
                  { path: "update/:rfi_drafter_uuid?", element: <CreateRFIPage /> },
                  { path: "add/:rfi_drafter_uuid/generate-rfi", element: <GenerateRFIPage /> },
                  { path: "update/:rfi_drafter_uuid/generate-rfi", element: <GenerateRFIPage /> },
                ],
              },

              /*** Bid Invites ***/
              {
                path: "bid-invites",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="bid_invites"
                    module="bid_invites"
                    permission="view"
                  >
                    <BidInviteLayoutPage />
                  </OrgPermissionGuard>
                ),
                children: [
                  { index: true, element: <BidInviteTablePage /> },
                  { path: "add/:bid_uuid?", element: <CreateBidPage /> },
                  { path: "update/:bid_uuid?", element: <CreateBidPage /> },
                  { path: ":bid_uuid?/bid-invite-company", element: <BidInviteForCompanyPage /> },
                  { path: ":bidId?/bid-invite-company", element: <BidInviteForCompanyPage /> },
                ],
              },

              /*** Clause Assist ***/
              {
                path: "clause-assist",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="clause_assist"
                    module="clause_assist"
                    permission="view"
                  >
                    <ClauseSuggesterPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "clause-assist/add",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="clause_assist"
                    module="clause_assist"
                    permission="create_draft"
                  >
                    <CreateClauseSuggesterPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "clause-assist/analyzing/:analysisUuid",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="clause_assist"
                    module="clause_assist"
                    permission="view"
                  >
                    <AnalyzingClausesPage />
                  </OrgPermissionGuard>
                ),
              },
              {
                path: "clause-assist/view/:id",
                element: (
                  <OrgPermissionGuard
                    parentPackageKey="contract_command"
                    packageKey="clause_assist"
                    module="clause_assist"
                    permission="view"
                  >
                    <AnalysisResultPage />
                  </OrgPermissionGuard>
                ),
              },

              /*** Contract Audit ***/
              {
                path: "contract-audit",
                children: [
                  {
                    index: true,
                    element: (
                      <OrgPermissionGuard
                        parentPackageKey="contract_command"
                        packageKey="contract_audit"
                        module="contract_audit"
                        permission="view"
                      >
                        <HealthCheckerTablePage />
                      </OrgPermissionGuard>
                    ),
                  },
                  {
                    path: "add",
                    element: (
                      <OrgPermissionGuard
                        parentPackageKey="contract_command"
                        packageKey="contract_audit"
                        module="contract_audit"
                        permission="create_draft"
                      >
                        <NewHealthCheckerPage />
                      </OrgPermissionGuard>
                    ),
                  },
                  {
                    path: "add/:checkerUuid/generate",
                    element: (
                      <OrgPermissionGuard
                        parentPackageKey="contract_command"
                        packageKey="contract_audit"
                        module="contract_audit"
                        permission="create_draft"
                      >
                        <AnalysisPage />
                      </OrgPermissionGuard>
                    ),
                  },
                  {
                    path: "view/:checkerUuid",
                    element: (
                      <OrgPermissionGuard
                        parentPackageKey="contract_command"
                        packageKey="contract_audit"
                        module="contract_audit"
                        permission="view"
                      >
                        <ContractHealthReportPage />
                      </OrgPermissionGuard>
                    ),
                  },
                ],
              },
            ],
          },


          {
            path: "roi-calculator",
            element: (
              <OrgPermissionGuard packageKey="roi_calc" module="roi_calculator" permission="view">
                <ROIProviderPage />
              </OrgPermissionGuard>
            ),
            children: [
              { index: true, element: <ROICalculatorPage /> },
              {
                path: "dashboard", element:
                  (
                    <OrgPermissionGuard packageKey="roi_calc" module="roi_calculator" permission="execute">
                      <ROIDashboardPage />
                    </OrgPermissionGuard>
                  ),
              },
            ],
          },

          /******** END CONTRACT COMMAND ********/
        ],
      },

      /******** END project/view block ********/

      /******** AUDIT LOGS ********/
      { path: "audit-logs", element: <AuditLogsPage /> },

      /******** SETTINGS ********/
      { path: "settings", element: <SettingsPage /> },

      { path: "restricted", element: <AccessDenied /> },
      { path: "restricted-package", element: <PackageRestricted /> },

      /******** PRODUCTS ********/
      {
        path: "products",
        element: <ProductLayoutPage />,
        children: [
          {
            index: true,
            element: (
              <OrgPermissionGuard module="products" permission="view">
                <ProductsPage />
              </OrgPermissionGuard>
            ),
          },
          { path: "add", element: <CreateProductPage /> },
          { path: "view/:id", element: <ViewProductPage /> },
          { path: "update/:id", element: <CreateProductPage /> },
        ],
      },

      /******** LABOR COST ********/
      {
        path: "labor-cost",
        element: <ProductLayoutPage />,
        children: [
          { index: true, element: <LaborCostPage /> },
          { path: "add", element: <CreateLaborCostPage /> },
          { path: "view/:id", element: <ViewLaborCostPage /> },
          { path: "update/:id", element: <CreateLaborCostPage /> },
        ],
      },

      /******** LABOR CREW AND MEMBER ********/
      // {
      //   path: "labor",
      //   element: <ProductLayoutPage />,
      //   children: [
      //     { index: true, element: <LaborCrewPage /> },
      //     { path: "add", element: <CreateMemberPage /> },
      //     { path: "view/:id", element: <ViewMemberPage /> },
      //     { path: "update/:id", element: <CreateMemberPage /> },
      //   ],
      // },

      {
  path: "labor",
  element: <ProductLayoutPage />,
  children: [
    { index: true, element: <Navigate to="crew" replace /> },
    {
      path: "crew",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="view">
          <LaborCrewPage />
        </OrgPermissionGuard>
      ),
    },
    {
      path: "crew/view/:id",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="view">
          <ViewCrewPage />
        </OrgPermissionGuard>
      ),
    },
    {
      path: "member",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="view">
          <LaborMemberPage />
        </OrgPermissionGuard>
      ),
    },
    {
      path: "member/add",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="create">
          <CreateMemberPage />
        </OrgPermissionGuard>
      ),
    },
    {
      path: "member/view/:id",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="view">
          <ViewMemberPage />
        </OrgPermissionGuard>
      ),
    },
    {
      path: "member/update/:id",
      element: (
        <OrgPermissionGuard module="labor_cost" permission="edit">
          <CreateMemberPage />
        </OrgPermissionGuard>
      ),
    },
  ],
},
      /******** ROLES — guarded ********/
      {
        path: "roles",
        element: <RolesAndPermissionsPage />,
        children: [
          {
            index: true,
            element: (
              <OrgPermissionGuard packageKey="roles" module="role_management" permission="view">
                <RolesPermissionTablePage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <OrgPermissionGuard packageKey="roles" module="role_management" permission="add">
                <NewRolesFormPage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "update/:role_uuid",
            element: (
              <OrgPermissionGuard packageKey="roles" module="role_management" permission="edit">
                <NewRolesFormPage />
              </OrgPermissionGuard>
            ),
          },
          {
            path: "view/:role_uuid",
            element: (
              <OrgPermissionGuard packageKey="roles" module="role_management" permission="view">
                <ViewRolePage />
              </OrgPermissionGuard>
            ),
          },
        ],
      },

      { path: "*", element: <Navigate to="projects" replace /> },
    ],
  },

  /*********************************************************
   * ADMIN PORTAL – UNAUTHENTICATED
   *********************************************************/

  {
    path: "admin",
    element: (
      <UnAuthRoute portal="admin">
        <SessionHandler portal="admin" />
        <AdminAuthLayout />
      </UnAuthRoute>
    ),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgetPasswordPage /> },
      { path: "reset_password", element: <ResetPasswordPage /> },
      {
        path: "two-factor-authentication",
        element: <TwoFactorAuthenticatePage />,
      },
      { path: "activate", element: <ActivateAccountPage /> },
    ],
  },

  /*********************************************************
   * ADMIN PORTAL – PROTECTED
   *********************************************************/
  {
    path: "admin",
    element: (
      <ProtectedRoute portal="admin">
        <SessionHandler portal="admin" />
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      ...userRoutes,
      { index: true, element: <AdminPortalEntryRedirect /> },
      // { index: true, element: <Navigate to="users" replace /> },
      { index: true, element: <AdminPortalEntryRedirect /> },
      { path: "restricted", element: <AccessDenied /> },

      { path: "organizations", element: <OrganizationsPage /> },
      {
        path: "organizations",
        children: [
          { index: true, element: <OrganizationsPage /> },
          { path: "add", element: <AddOrganizationPage /> },
          { path: "update/:id", element: <AddOrganizationPage /> },
          { path: "view/:id", element: <OrganizationViewPage /> },

          {
            index: true,
            element: (
              <PermissionGuard
                module="organization_management"
                permission="view"
              >
                <OrganizationsPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <PermissionGuard
                module="organization_management"
                permission="create"
              >
                <AddOrganizationPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard
                module="organization_management"
                permission="edit"
              >
                <AddOrganizationPage />
              </PermissionGuard>
            ),
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard
                module="organization_management"
                permission="view"
              >
                <OrganizationViewPage />
              </PermissionGuard>
            ),
          },
          {
            path: "projects-list/:organization_uuid",
            element: (
              <PermissionGuard
                module="organization_management"
                permission="view"
              >
                <OrganizationProjectsList />
              </PermissionGuard>
            ),
          },
          {
            path: "users-list/:organization_uuid",
            element: (
              <PermissionGuard
                module="organization_management"
                permission="view"
              >
                <OrganizationUsersList />
              </PermissionGuard>
            ),
          },
        ],
      },
      {
        path: "organizations",
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="organization_management" permission="view">
                <OrganizationsPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <PermissionGuard module="organization_management" permission="create">
                <AddOrganizationPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard module="organization_management" permission="edit">
                <AddOrganizationPage />
              </PermissionGuard>
            ),
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard module="organization_management" permission="view">
                <OrganizationViewPage />
              </PermissionGuard>
            ),
          },
          // ✅ projects-list — no admin/ prefix
          {
            path: "projects-list/:organization_uuid",
            element: (
              <PermissionGuard module="organization_management" permission="view">
                <OrganizationProjectsList />
              </PermissionGuard>
            ),
          },
          // ✅ users-list — no admin/ prefix
          {
            path: "users-list/:organization_uuid",
            element: (
              <PermissionGuard module="organization_management" permission="view">
                <OrganizationUsersList />
              </PermissionGuard>
            ),
          },
        ],
      },
      {
        path: "users",
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="user_management" permission="view">
                <AdminListPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <PermissionGuard module="user_management" permission="add">
                <AdminCreateUserPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard module="user_management" permission="edit">
                <AdminCreateUserPage />
              </PermissionGuard>
            ),
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard module="user_management" permission="view">
                <AdminviewPage />
              </PermissionGuard>
            ),
          },
        ],
      },
      {
        path: "packages",
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="package_management" permission="view">
                <PackageListPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <PermissionGuard module="package_management" permission="create">
                <CreatePackagePage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard module="package_management" permission="edit">
                <CreatePackagePage />
              </PermissionGuard>
            ),
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard module="package_management" permission="view">
                <ViewPackagePage />
              </PermissionGuard>
            ),
          },
        ],
      },

      /******** PROJECTS ********/
      {
        path: "projects",
        element: <ProjectLayoutPage />,
        children: [
          { index: true, element: <ProjectsListPage /> },
          { path: "create", element: <CreateProjectPage /> },
          { path: "update/:id", element: <CreateProjectPage /> },
        ],
      },

      /******** PRODUCTS ********/
      {
        path: "products",
        element: <ProductLayoutPage />,
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="products" permission="view">
                <ProductsPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: <CreateProductPage />,
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard module="products" permission="view">
                <ViewProductPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard module="products" permission="edit">
                <CreateProductPage />
              </PermissionGuard>
            ),
          },
        ],
      },

      /******** LABOR COST ********/
      {
        path: "labor-cost",
        element: <ProductLayoutPage />,
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="labor_cost" permission="view">
                <LaborCostPage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: <CreateLaborCostPage />,
          },
          {
            path: "view/:id",
            element: (
              <PermissionGuard module="labor_cost" permission="view">
                <ViewLaborCostPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:id",
            element: (
              <PermissionGuard module="labor_cost" permission="edit">
                <CreateLaborCostPage />
              </PermissionGuard>
            ),
          },
        ],
      },

      /******** LABOR CREW AND MEMBER ********/
      // {
      //   path: "labor",
      //   element: <ProductLayoutPage />,
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <PermissionGuard module="labor_cost" permission="view">
      //           <LaborCrewPage />
      //         </PermissionGuard>
      //       ),
      //     },
      //     {
      //       path: "add",
      //       element: <CreateMemberPage />,
      //     },
      //     {
      //       path: "view/:id",
      //       element: (
      //         <PermissionGuard module="labor_cost" permission="view">
      //           <ViewMemberPage />
      //         </PermissionGuard>
      //       ),
      //     },
      //     {
      //       path: "update/:id",
      //       element: (
      //         <PermissionGuard module="labor_cost" permission="edit">
      //           <CreateMemberPage />
      //         </PermissionGuard>
      //       ),
      //     },
      //   ],
      // },

      {
  path: "labor",
  element: <ProductLayoutPage />,
  children: [
    { index: true, element: <Navigate to="crew" replace /> },
    {
      path: "crew",
      element: (
        <PermissionGuard module="labor_cost" permission="view">
          <LaborCrewPage />
        </PermissionGuard>
      ),
    },
    {
      path: "crew/view/:id",
      element: (
        <PermissionGuard module="labor_cost" permission="view">
          <ViewCrewPage />
        </PermissionGuard>
      ),
    },
    {
      path: "member",
      element: (
        <PermissionGuard module="labor_cost" permission="view">
          <LaborMemberPage />
        </PermissionGuard>
      ),
    },
    {
      path: "member/add",
      element: (
        <PermissionGuard module="labor_cost" permission="create">
          <CreateMemberPage />
        </PermissionGuard>
      ),
    },
    {
      path: "member/view/:id",
      element: (
        <PermissionGuard module="labor_cost" permission="view">
          <ViewMemberPage />
        </PermissionGuard>
      ),
    },
    {
      path: "member/update/:id",
      element: (
        <PermissionGuard module="labor_cost" permission="edit">
          <CreateMemberPage />
        </PermissionGuard>
      ),
    },
  ],
},
      /******** ROLES & PERMISSIONS ********/
      {
        path: "roles",
        element: (
          // <PermissionGuard module="role_management" permission="view">
          <RolesAndPermissionsPage />
          //  </PermissionGuard>
        ),
        children: [
          {
            index: true,
            element: (
              <PermissionGuard module="role_management" permission="view">
                <RolesPermissionTablePage />
              </PermissionGuard>
            ),
          },
          {
            path: "add",
            element: (
              <PermissionGuard module="role_management" permission="add">
                <NewRolesFormPage />
              </PermissionGuard>
            ),
          },
          {
            path: "update/:role_uuid",
            element: (
              <PermissionGuard module="role_management" permission="edit">
                <NewRolesFormPage />
              </PermissionGuard>
            ),
          },
          {
            path: "view/:role_uuid",
            element: (
              <PermissionGuard module="role_management" permission="view">
                <ViewRolePage />
              </PermissionGuard>
            ),
          },
        ],
      },

      /******** AUDIT LOGS ********/
      { path: "audit-logs", element: <AuditLogsPage /> },

      /******** SETTINGS ********/
      { path: "settings", element: <UnderDevelopment /> },

      { path: "*", element: <Navigate to="users" replace /> },
    ],
  },

  // Catch-all — anything unknown goes to org login
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
