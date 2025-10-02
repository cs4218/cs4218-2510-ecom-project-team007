import React, { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet, useNavigate } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function PrivateRoute(){
    const [ok,setOk] = useState(false)
    const [auth,setAuth] = useAuth()
    const navigate = useNavigate();

    useEffect(()=> {
        const authCheck = async() => {
            try {
                const res = await axios.get("/api/v1/auth/user-auth");
                if(res.data.ok){
                    setOk(true);
                } else {
                    // unauthorized: clear auth & redirect
                    setAuth({ user: null, token: "" });
                    localStorage.removeItem("auth");
                    navigate("/login");
                }
            } catch(err) {
                // token expired or invalid: clear auth & redirect
                setAuth({ user: null, token: "" });
                localStorage.removeItem("auth");
                navigate("/login");
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token, navigate, setAuth]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}