import { userLogin, userRegister } from "@api/backendApi";
import useStore from "@store/store";
import { useState } from "react";

const LoginOrRegister = () => {
    const [whichPanel, setWhichPanel] = useState<boolean>(false); // false for Login, true for Register
    return (<>
        <div className="m-2 flex" style={{ justifyContent: "space-evenly" }}>
            <button onClick={() => { setWhichPanel(false) }}>{`登录`}</button>
            <button onClick={() => { setWhichPanel(true) }}>{`注册`}</button>
        </div>
        {whichPanel ?
            <RegisterForm
                onSuccess={() => setWhichPanel(false)}
            />
            : <LoginForm />
        }
    </>)
};

const RegisterForm = (
    { onSuccess, onFailure }: { onSuccess?: () => void, onFailure?: () => void }
) => {
    const [uName, setUName] = useState<string>('');
    const [eMail, setEMail] = useState<string>('');
    const [paswd, setPaswd] = useState<string>('');

    const setError = useStore((state) => state.setError);

    const handleRegister = async () => {
        if (!(uName && eMail && paswd)) return;
        const result = await userRegister({
            username: uName,
            email: eMail,
            password: paswd,
        });
        if (result.code == 0) {
            if (onSuccess) onSuccess();
        } else {
            setError(result.error_msg);
            if (onFailure) onFailure();
        }
    }
    return (<>
        <div className="min-w-[calc(300px)] min-h-[calc(300px)] flex flex-col">
            {/* <div className="m-4">{`注册新用户`}</div> */}
            <div className="flex m-4" style={{ "justifyContent": "space-between" }}>
                <span>{`用户名`}</span>
                <input
                    className='pl-2 text-gray-800 bg-white transition-opacity focus:outline-none rounded border border-gray/20'
                    type="text"
                    value={uName}
                    onChange={(e) => {
                        setUName(e.target.value);
                    }}
                />
            </div>
            <div className="flex m-4" style={{ "justifyContent": "space-between" }}>
                <span>{`Email`}</span>
                <input
                    className='pl-2 text-gray-800 bg-white transition-opacity focus:outline-none rounded border border-gray/20'
                    type="email"
                    value={eMail}
                    onChange={(e) => {
                        setEMail(e.target.value);
                    }}
                />
            </div>
            <div className="flex m-4" style={{ "justifyContent": "space-between" }}>
                <span>{`密码`}</span>
                <input
                    className='pl-2 text-gray-800 bg-white transition-opacity focus:outline-none rounded border border-gray/20'
                    type="password"
                    value={paswd}
                    onChange={(e) => {
                        setPaswd(e.target.value);
                    }}
                />
            </div>
            <div className="flex m-4" style={{ "justifyContent": "center" }}>
                <button
                    className="btn btn-primary max-w-fit"
                    onClick={handleRegister}>
                    {`注册`}
                </button>
            </div>
        </div>
    </>)
}

const LoginForm = (
    { onSuccess, onFailure }: { onSuccess?: () => void, onFailure?: () => void }
) => {
    const [uName, setUName] = useState<string>('');
    const [paswd, setPaswd] = useState<string>('');

    const setUser = useStore((state) => state.setUser);
    const setError = useStore((state) => state.setError);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleLogin();
        }
    }

    const handleLogin = async () => {
        if (!uName || !paswd) return;
        const result = await userLogin({
            username: uName,
            password: paswd,
        });
        if (result.code == 0) {
            const token = result.data.token;
            if (token) {
                setUser({
                    isValid: true,
                    username: uName,
                    email: '',
                    token,
                });
            };
            if (onSuccess) onSuccess();
        } else {
            setError(result.error_msg);
            if (onFailure) onFailure();
        }
    }

    return (<>
        <div className="min-w-[calc(300px)] min-h-[calc(300px)] flex flex-col">
            {/* <div className="m-4">{`用户登录`}</div> */}
            <div className="flex m-4" style={{ "justifyContent": "space-between" }}>
                <span>{`用户名`}</span>
                <input
                    className='pl-2 text-gray-800 bg-white transition-opacity focus:outline-none rounded border border-gray/20'
                    type="text"
                    value={uName}
                    onChange={(e) => {
                        setUName(e.target.value);
                    }}
                />
            </div>
            <div className="flex m-4" style={{ "justifyContent": "space-between" }}>
                <span>{`密码`}</span>
                <input
                    className='pl-2 text-gray-800 bg-white transition-opacity focus:outline-none rounded border border-gray/20'
                    type="password"
                    value={paswd}
                    onChange={(e) => {
                        setPaswd(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                />
            </div>
            <div className="flex m-4" style={{ "justifyContent": "center" }}>
                <button
                    className="btn btn-primary max-w-fit"
                    onClick={handleLogin}>
                    {`登录`}
                </button>
            </div>
        </div>
    </>)
}

export default LoginOrRegister;