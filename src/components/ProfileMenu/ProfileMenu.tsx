import { useState } from "react";
import PopupModal from "@components/PopupModal";
import PersonIcon from "@icon/PersonIcon";
import useStore from "@store/store";
import LoginOrRegister from "./LoginOrRegister";
import { defaultUserInfo } from "@constants/user";

const ProfileMenu = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const user = useStore((state) => state.user);

  return (
    <>
      <a
        className='flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        <PersonIcon />
        {`用户信息`}
      </a>
      {isModalOpen && (
        <PopupModal
          title={`用户信息`}
          setIsModalOpen={setIsModalOpen}
          cancelButton={false}
        >
          {user.isValid ? <UserProfileDisplay /> : <LoginOrRegister />}
        </PopupModal>
      )}
    </>
  );
};

const UserProfileDisplay = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  // Get user info from server

  const handleLogOut = () => {
    setUser(defaultUserInfo);
  }

  return (
    <div className="min-w-[calc(300px)] min-h-[calc(300px)] flex flex-col" style={{ justifyItems: 'center' }}>
      <div className="m-4">{`Username: ${user.username}`}</div>
      {/* <div>{`Email: ${user.email}`}</div> */}
      <button onClick={handleLogOut} className="btn btn-dark max-w-fit">Logout</button>
    </div>
  )
}

export default ProfileMenu;