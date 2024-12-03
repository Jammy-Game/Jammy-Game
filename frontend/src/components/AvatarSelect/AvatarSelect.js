import React, { useEffect, useState } from "react";
import "./AvatarSelect.css";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { getAvatars } from "../../pages/store";
import registerBg from "../../assets/img/registerBg.png";
import CloseButton from "../CloseButton/CloseButton";
import axios from "axios";

const AvatarSelect = (props) => {
  const [avatarList, setAvatarList] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const dispatch = useDispatch();

  const updateValues = {
    username: "",
  };

  const { control, setValue, handleSubmit } = useForm({ updateValues });
  useEffect(() => {
    dispatch(getAvatars())
      .then((result) => {
        if (result.payload) {
          setAvatarList(result.payload.data);
        }
      })
      .catch((error) => console.log(error));
  }, [dispatch]);
  const onSubmit = async (data) => {
    if (
      Object.values(data).every(
        (field) => field === undefined || field.length > 0
      )
    ) {
      if (selectedAvatar !== null) {
        data["avatar"] = selectedAvatar;
      }
      await axios
        .post(`${process.env.REACT_APP_API}users/profile/update`, data, {
          headers: { "Content-Type": "application/json" },
        })
        .then((result) => {
          console.log(result);
          if (result.data.statusCode !== 201) {
            console.log(result.payload?.data?.error);
          }
        })
        .catch((err) => {
          console.log(err);
        });
      props.onClose();
    }
  };
  return (
    <>
      {props.show && (
        <div className="popup-avatar popup">
          <CloseButton onClose={props.onClose} />
          <div className="in">
            <img src={registerBg} className="w-100" alt="" />
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="box-inner-area">
                {/* <div className="formItem">
                  <h4>USERNAME : </h4>
                  <div className="input">
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <input
                          id="username"
                          placeholder="Write your username"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div> */}
                <div className="box-right-avatar">
                  <h4>CHOOSE YOUR AVATAR</h4>
                  <div className="avatar-inner">
                    {avatarList.map((fileName, index) => (
                      <Link
                        href="#"
                        className={selectedAvatar === fileName ? "active" : ""}
                        key={index}
                        onClick={() => setSelectedAvatar(fileName)}
                      >
                        <img
                          src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/${fileName}`}
                          alt=""
                        />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="btns-bottom">
                  <button type="submit" className="btn-sub">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarSelect;
