import React from "react";
import { AdminUsersPage, UserFormPage , ProfileLayoutPage} from "./optimisedRoutes/techus-lazyRoutes";

const userRoutes = [
  { path: "users", element: <AdminUsersPage /> },
  { path: "users/add-user", element: <UserFormPage /> },
  { path: "users/edit-user", element: <UserFormPage /> },
  { path: "users/edit-user", element: <UserFormPage /> }, 
  { path: "profile", element: <ProfileLayoutPage />},
  { path: "change-password", element: <ProfileLayoutPage />},
];

export default userRoutes;
