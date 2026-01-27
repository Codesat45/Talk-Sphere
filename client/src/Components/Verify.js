import React, { useEffect, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import styled from "styled-components";

import { GoMail, GoRead } from "react-icons/go";

import {
  verifyEmailLink,
  userVerification,
} from "../Redux/Reducer/Auth/auth.action";
import { getMySelf } from "../Redux/Reducer/User/user.action";

const Verify = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useParams();

  const [status, setStatus] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("We are verifying your Email...");
  const [userData, setUserData] = useState({ email: "" });

  const result = useSelector((state) => state.auth.message);
  const success = useSelector((state) => state.auth.success);

  // verify email token
  useEffect(() => {
    if (token) {
      dispatch(verifyEmailLink(token));
      dispatch(getMySelf());
    }
  }, [token, dispatch]);

  // update verification status
  useEffect(() => {
    if (success) {
      setStatus(true);
    }
  }, [success]);

  // redirect after verification
  useEffect(() => {
    if (status) {
      navigate("/");
    }
  }, [status, navigate]);

  // update message
  useEffect(() => {
    if (result) {
      setMessage(result);
    }
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
    <Wrapper className="flex flex-col items-center justify-center">
      {status ? (
        <div className="flex flex-col items-center justify-center w-3/4">
          <GoRead className="icon" color="#8af859" />

          <p className="text-2xl my-2 text-center">
            Your Email is verified.
          </p>

          <button
            className="bg-blue-500 my-4 px-6 py-3 rounded-lg"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl text-white">Start Chatting</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center w-3/4">
            <GoMail className="icon" color="#faab07" />

            <p className="text-2xl my-4 text-center">{message}</p>

            <button
              className="bg-blue-500 px-6 py-3 rounded-lg"
              onClick={() => setIsOpen(true)}
            >
              <span className="text-2xl text-white">
                Verification Link Resend
              </span>
            </button>
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
                        <button onClick={closeModal} className="mr-4">
                          Cancel
                        </button>
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
    </Wrapper>
  );
};

export default Verify;

const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: ${({ theme }) => theme.colors.bg.primary};

  .icon {
    width: 50%;
    height: 50%;
  }

  p {
    color: ${({ theme }) => theme.colors.heading};
  }
`;
