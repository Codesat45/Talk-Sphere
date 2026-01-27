import React, { useEffect, useState, Fragment } from "react";
import { GoMail, GoRead } from "react-icons/go";
import { useSelector, useDispatch } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { getMySelf } from "../Redux/Reducer/User/user.action";
import { userVerification, signOut } from "../Redux/Reducer/Auth/auth.action";

const Verification = () => {
  const [status, setStatus] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(
    "Your Email is not Verified. We have sent a verification Mail to your Account. Please Check your Spam or Junk Folder."
  );
  const [userData, setUserData] = useState({ email: "" });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.userDetails);
  const result = useSelector((state) => state.auth.message);

  useEffect(() => {
    if (localStorage.ETalkUser) {
      dispatch(getMySelf());
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!user) navigate("/");
    if (user) setStatus(user.is_verified);
  }, [user, navigate]);

  useEffect(() => {
    if (status) navigate("/");
  }, [status, navigate]);

  useEffect(() => {
    if (result) setMessage(result);
  }, [result]);

  const closeModal = () => {
    setUserData({ email: "" });
    setIsOpen(false);
  };

  const sendMail = () => {
    if (!userData.email) {
      alert("Please enter a valid email");
      return;
    }
    dispatch(userVerification(userData));
    closeModal();
  };

  return (
    <Wrapper>
      <div className="m-4 p-4 h-full flex flex-col items-center justify-center">
        {status ? (
          <div className="flex flex-col items-center justify-center w-2/4">
            <GoRead className="mail-icon" color="#8af859" />
            <p className="my-2">Your Email is Verified Now.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center w-3/4">
              <GoMail className="mail-icon" color="#faab07" />
              <h1>Verify Your Email</h1>
              <p className="my-2 px-2">{message}</p>
              <p className="my-2 font-bold">OR</p>

              <div className="flex">
                <button onClick={() => dispatch(signOut())}>Home</button>
                <button onClick={() => setIsOpen(true)}>Resend</button>
              </div>
            </div>

            <Transition appear show={isOpen} as={Fragment}>
              <Dialog as="div" className="relative z-10" onClose={closeModal}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                    >
                      <Dialog.Panel className="w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <Dialog.Title className="text-lg text-center font-medium">
                          Resend Verification Mail
                        </Dialog.Title>

                        <div className="mt-4">
                          <label className="block mb-2 text-sm font-medium">
                            Enter your Email
                          </label>
                          <input
                            type="email"
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="e.g. test@gmail.com"
                            value={userData.email}
                            onChange={(e) =>
                              setUserData({ email: e.target.value })
                            }
                          />
                        </div>

                        <div className="flex justify-end mt-4">
                          <button onClick={closeModal}>Cancel</button>
                          <button onClick={sendMail}>Send</button>
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </>
        )}
      </div>
    </Wrapper>
  );
};

export default Verification;

const Wrapper = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;

  .mail-icon {
    font-size: 20rem;
  }

  button {
    margin: 0.5rem;
    padding: 0.6rem 2rem;
    border-radius: 10px;
    background-color: cyan;
    transition: all 0.3s ease;
  }

  button:hover {
    transform: translateY(-3px);
  }

  h1 {
    font-size: 2.4rem;
    font-weight: bold;
    margin: 15px 0;
    text-align: center;
  }

  p {
    text-align: center;
    max-width: 800px;
    line-height: 27px;
  }
`;
