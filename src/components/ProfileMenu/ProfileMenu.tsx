import { useState } from "react";
import PopupModal from "@components/PopupModal";
import PersonIcon from "@icon/PersonIcon";
import useStore from "@store/store";
import LoginOrRegister from "./LoginOrRegister";
import { defaultUserInfo } from "@constants/user";
import useBackup from "@hooks/useBackup";
import { ChatToSession } from "@constants/chat";

export const ProfileMenuButton = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const setMainPagenum = useStore((state) => state.setMainPagenum);

  return (
    <>
      <a
        className='flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
        onClick={() => {
          // setIsModalOpen(true);
          setMainPagenum(1);
        }}
      >
        <PersonIcon />
        {`用户信息`}
      </a>
    </>
  );
};

export const ProfileMenu = () => {
  const user = useStore((state) => state.user);
  return <>
    {user.isValid ? <UserProfileDisplay /> : <LoginOrRegister />}
  </>
}

const UserProfileDisplay = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const { syncToServer, syncFromServer } = useBackup();
  // Get user info from server

  const handleLogOut = () => {
    setUser(defaultUserInfo);
  };

  const syncUpDicts = async () => {
    // await syncToServer('userdict', { dict: useStore.getState().userDicts[currentDictIndex] });
    await syncToServer('userdict', { dict: useStore.getState().userDicts[0] });
  }

  const syncDownDicts = async () => {
    await syncFromServer('userdict');
    // setShowDictDropup(false);
  }

  const syncUpPrompts = async () => {
    await syncToServer('userprompt', { prompts: useStore.getState().userPrompts });
  }

  const syncDownPrompts = async () => {
    await syncFromServer('userprompt');
  }

  const syncUpSessions = async () => {
    const sessions = useStore.getState().sessions;
    if (!sessions) return;
    const queries = sessions.map((session) => syncToServer('session', { session }));
    await Promise.all(queries);
  };

  const syncDownSessions = async () => {
    await syncFromServer('session');
  };

  return (
    <div className="min-w-[calc(300px)] min-h-[calc(300px)] flex flex-col" style={{ justifyItems: 'center' }}>
      <div className="m-4">{`Username: ${user.username}`}</div>
      {/* <div>{`Email: ${user.email}`}</div> */}
      <div className="flex m-4" style={{ justifyItems: 'center' }}>
        <button onClick={syncUpSessions} className="btn btn-neutral max-w-fit">{`上传翻译记录`}</button>
        <button onClick={syncUpDicts} className="btn btn-neutral max-w-fit">{`上传用户字典`}</button>
        <button onClick={syncUpPrompts} className="btn btn-neutral max-w-fit">{`上传用户提示词`}</button>
      </div>
      <div className="flex m-4" style={{ justifyItems: 'center' }}>
        <button onClick={syncDownSessions} className="btn btn-neutral max-w-fit">{`下载翻译记录`}</button>
        <button onClick={syncDownDicts} className="btn btn-neutral max-w-fit">{`下载用户字典`}</button>
        <button onClick={syncDownPrompts} className="btn btn-neutral max-w-fit">{`下载用户提示词`}</button>
      </div>
      <button onClick={handleLogOut} className="btn btn-dark max-w-fit">Logout</button>
      {/* <button onClick={async () => {
        await syncFromServer('chat');
        const chats = useStore.getState().chats;
        if (chats) {
          const sessions = chats.map((c) => ChatToSession(c));
          sessions.forEach(async (s) => {
            await syncToServer('session', { session: s });
          })
        }
      }}>
        Debug
      </button> */}
    </div>
  )
}

export default ProfileMenuButton;