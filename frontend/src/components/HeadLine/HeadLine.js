import React from "react";
import "./HeadLine.css";
import UserProfile from "../UserProfile/UserProfile";
import { Link, useLocation } from "react-router-dom";
//images
import logo2Img from "../../assets/img/logo2.svg";

const HeadLine = () => {
  const { search } = useLocation();
  return (
    <div className="d-flex justify-content-between align-items-center flex-nowrap ">
      <Link to={search} className="logo-lobby col-3">
        <img src={logo2Img} alt="" />
      </Link>
      <UserProfile />
    </div>
  );
};

export default HeadLine;
