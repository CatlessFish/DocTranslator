import React from 'react';
import useStore from '@store/store';
import CrossIcon from '@icon/CrossIcon';

const Pages = ({
    children,
    displayIndex,
}: {
    children?: { content: React.ReactElement, title: string }[],
    displayIndex?: number,
}) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const setMainPagenum = useStore((state) => state.setMainPagenum);
    const _displayIndex = useStore((state) => state.mainPagenum);

    return (
        <div
            className={`flex h-full flex-1 flex-col ${hideSideMenu ? 'md:pl-0' : 'md:pl-[260px]'
                }`}
        >
            {_displayIndex != 0 && (
                <div className='flex m-2 border-b' style={{ 'justifyContent': 'space-between' }}>
                    <div className='text-lg font-semibold p-2'>
                        {children && children[_displayIndex].title}
                    </div>
                    <button onClick={() => setMainPagenum(0)} className='h-[36px] pr-4'>
                        <CrossIcon />
                    </button>
                </div>
            )}
            <main className='relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1'>
                {children && children[_displayIndex].content}
            </main>
        </div>
    );
};

export default Pages;
