import { useTranslation } from 'react-i18next';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ReactComponent as CardIcon } from 'assets/icons/cardCategories/Card-icon.svg';
import { ReactComponent as PopularIcon } from 'assets/icons/cardCategories/Popular-icon.svg';
import { ReactComponent as CashbackIcon } from 'assets/icons/cardCategories/Cashback-icon.svg';
import { ReactComponent as TravelIcon } from 'assets/icons/cardCategories/Travel-icon.svg';
import { ReactComponent as CryptoIcon } from 'assets/icons/cardCategories/Crypto-icon.svg';

const ALL_CREDIT_CARDS = 'allCreditCards';
const MOST_POPULAR = 'mostPopular';
const CASH_BACK_CARDS = 'cashBackCards';
const TRAVEL_CARDS = 'travelCards';
const CRYPTO = 'crypto';

export default function cardTypeRoutes() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return [
    {
      type: ALL_CREDIT_CARDS,
      title: t(ALL_CREDIT_CARDS),
      img: <CardIcon />,
      onClick: () => navigate(`/card-list/${ALL_CREDIT_CARDS}`)
    },
    {
      type: MOST_POPULAR,
      title: t(MOST_POPULAR),
      img: <PopularIcon />,
      onClick: () => navigate(`/card-list/${MOST_POPULAR}`)
    },
    {
      type: CASH_BACK_CARDS,
      title: t(CASH_BACK_CARDS),
      img: <CashbackIcon />,
      onClick: () => navigate(`/card-list/${CASH_BACK_CARDS}`)
    },
    {
      type: TRAVEL_CARDS,
      title: t(TRAVEL_CARDS),
      img: <TravelIcon />,
      onClick: () => navigate(`/card-list/${TRAVEL_CARDS}`)
    },
    {
      type: CRYPTO,
      title: t(CRYPTO),
      img: <CryptoIcon />,
      onClick: () => navigate(`/card-list/${CRYPTO}`)
    }
  ];
}
