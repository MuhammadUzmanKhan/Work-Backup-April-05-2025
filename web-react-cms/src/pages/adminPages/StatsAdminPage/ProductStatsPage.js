/* eslint-disable react/no-unescaped-entities */
import React, { useMemo } from 'react';
import BaseTextField from 'components/formControl/baseTextField/BaseTextField';
import { Box, Stack, Typography } from '@mui/material'
import palette from 'theme/palette';
import { useTranslation } from 'react-i18next';
import { ReactComponent as IconSearch } from 'assets/icons/Icon-Search.svg';
import styles from 'pages/productsSection/products/cards.module.scss';

// import { ReactComponent as CancelCircleIcon } from 'assets/icons/cancel-circle-icon.svg';
import { ReactComponent as FilterIcon } from 'assets/icons/filter-icon.svg';
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined';
import Table from 'components/Table';

const ProductStatsPage = () => {
    const { t } = useTranslation();
    const data = React.useMemo(
        () => [
            {
                product: 'product1',
                category: 'category1',
                views: 'views1',
                clicks: 'clicks1',
                rating: 'rating1',
            },
            {
                product: 'product2',
                category: 'category2',
                views: 'views2',
                clicks: 'clicks2',
                rating: 'rating2',
            },
            {
                product: 'product3',
                category: 'category3',
                views: 'views3',
                clicks: 'clicks3',
                rating: 'rating3',
            },
        ],
        []
    )
    const columns = useMemo(
        () => [
            {
                Header: 'Header',
                columns: [
                    {
                        Header: 'Product',
                        accessor: 'product',
                    },
                    {
                        Header: 'Category',
                        accessor: 'category',
                    },
                    {
                        Header: 'Views',
                        accessor: 'views',
                    },
                    {
                        Header: 'Clicks on Apply',
                        accessor: 'clicks',
                    },
                    {
                        Header: 'Rating',
                        accessor: 'rating',
                    },
                ],
            }
        ],
        []
    )

    return (
        <>
            <Typography variant="h3" my={2} fontFamily="Helvetica Neue" color={palette.darkPurple[900]}>
                Your Product's Statistics
            </Typography>
            <Stack direction={'row'} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" component="div" fontFamily="Helvetica Neue" color={palette.darkPurple[900]}>
                    Here is how your products are performing on our app
                </Typography>
                <Box>
                    <BaseTextField
                        sx={{ width: '15rem', margin: "0", marginRight: "5px" }}
                        rounded
                        placeholder={t('search')}
                        value={() => { }}
                        onChange={() => { }}
                        InputProps={{
                            startAdornment: (
                                <Box sx={{ marginLeft: '19px', display: 'flex' }}>
                                    <IconSearch />
                                </Box>
                            )
                            // endAdornment: value ? (
                            //     <Box onClick={() => {}} sx={{ marginRight: '10px', display: 'flex' }}>
                            //         <CancelCircleIcon />
                            //     </Box>
                            // ) : (
                            //     <div />
                            // )
                        }}
                    />
                    <FilterIcon onClick={() => { }} className={styles.filterIcon} sx={{ marginX: "5" }} />
                    <SwapVertOutlinedIcon className={styles.filterIcon} fontSize="medium" />
                </Box>
            </Stack>
            <Table columns={columns} data={data} />
        </>

    )
}

export default ProductStatsPage;