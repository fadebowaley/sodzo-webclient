import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// const API_URL = import.meta.env.VITE_API_URL;

// Note: login function is now handled by AuthContext.login()
// This file kept for backward compatibility if needed

export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/landing"); // redirect to landing page
  };

  return handleLogout;
};
