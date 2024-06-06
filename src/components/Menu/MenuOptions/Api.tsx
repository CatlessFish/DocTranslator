import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import PersonIcon from '@icon/PersonIcon';
import ApiMenu from '@components/ApiMenu';
import MoneyIcon from '@icon/MoneyIcon';

const Config = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const setMainPagenum = useStore((state) => state.setMainPagenum);

  return (
    <>
      <a
        className='flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
        id='api-menu'
        // onClick={() => setIsModalOpen(true)}
        onClick={() => { setMainPagenum(2) }}
      >
        <MoneyIcon />
        {t('api')}
      </a>
      {/* {isModalOpen && <ApiMenu setIsModalOpen={setIsModalOpen} />} */}
    </>
  );
};

export default Config;
