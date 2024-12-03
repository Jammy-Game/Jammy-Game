import React, { useEffect, useState } from "react";
import "./Register.css";
import { Link } from "react-router-dom";
import { useMetaMask } from "../../utility/hooks/useMetaMask";
import { useForm, Controller } from 'react-hook-form'
import { useDispatch } from "react-redux";
import { getAvatars } from "../../pages/store";
import CloseButton from "../CloseButton/CloseButton";
//images
import registerBg from "../../assets/img/registerBg.png"

const defaultValues = {
  wallet: '',
  username: '',
  referrerCode: undefined
}

const Register = () => {
  const [avatarList, setAvatarList] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [errorMessage, setErrorMessage] = useState(false)

  const { wallet } = useMetaMask()

  const dispatch = useDispatch();

  // ** Vars
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  useEffect(() => {
    setValue('wallet', wallet.accounts[0])
  }, [wallet, setValue])

  useEffect(() => {
      dispatch(getAvatars()).then((result) => {
        if(result.payload) {
          setAvatarList(result.payload.data);
        }
      }).catch(error => console.log(error));
  }, [dispatch])

  // ** Function to handle form submitt
  const onSubmit = data => {
    setErrorMessage(null)
    if (Object.values(data).every(field => field === undefined || field.length > 0)) {
      if(selectedAvatar !== null) {
        data['avatar'] = selectedAvatar
      }
    } else {
      for (const key in data) {
        if (data[key] !== undefined && data[key].length === 0) {
          return setErrorMessage(`${key} cannot be empty`)
        }
      }
    }
  }

  return (
    <>
        <div className="popup-register popup">
          <CloseButton onClose={() => console.log("openPopupRegister(false)")} />
          <div className="in">
            <img src={registerBg} className="w-100" alt="" />
            <form onSubmit={handleSubmit(onSubmit)} >
              <div className="box-inner-area">
                <div className="form-left">
                  <div className="container">
                    <div className="col-lg-12 formItem">
                      <span>WALLET ADDRESS:</span>
                      <div className="input">
                        <Controller
                          name='wallet'
                          control={control}
                          render={({ field }) => (
                            <input id='wallet' disabled={true} placeholder='0x00' invalid={errors.wallet && true} {...field} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 formItem">
                      <span>USERNAME:</span>
                      <div className="input">
                        <Controller
                          name='username'
                          control={control}
                          render={({ field }) => (
                            <input id='username' placeholder='Write your username' invalid={errors.username && true} {...field} />
                          )}
                        />
                        <img
                          className="icon-warning"
                          alt=""
                        />
                      </div>
                      <small className="note">
                      </small>
                    </div>
                    <div className="col-lg-12 formItem">
                      <span>REFERENCE CODE:</span>
                      <div className="input">
                        <Controller
                          name='referrerCode'
                          control={control}
                          render={({ field }) => (
                            <input id='referrerCode' placeholder='Reference code' {...field} />
                          )}
                        />          
                      </div>
                      <small className="note">
                        *optional
                      </small>
                    </div>
                    <div className="col-lg-12 formItem">
                      <p style={{ color: 'red', textAlign: 'right'}}>{ errorMessage }</p>
                    </div>
                  </div>
                </div>
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
                        <img src={`${process.env.REACT_APP_PHOTO_SERVICE}avatars/${fileName}`} alt="" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="btns-bottom">
                  <button type='submit' className="btn-sub">
                    Sign Up
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
    </>
  );
};

export default Register;
