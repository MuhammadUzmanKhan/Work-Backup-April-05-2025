import { Route, Routes } from 'react-router-dom';

import React from 'react';

import NoMatch from 'pages/NoMatch';

import 'amplify/index';
import 'utils/logger';

// Admin Pages

import PartnersAdminPage from 'pages/adminPages/PartnersAdminPage/PartnersAdminPage';
import PartnerCreateAdminPage from 'pages/adminPages/PartnersAdminPage/PartnerCreateAdminPage';
import PartnerDetailsAdminPage from 'pages/adminPages/PartnersAdminPage/PartnerDetailsAdminPage';
import ProductsAdminPage from 'pages/adminPages/ProductsAdminPage/ProductsAdminPage';
import SpecificProducts from 'pages/adminPages/ProductsAdminPage/SpecificProducts';
import ProductDetailsAdminPage from 'pages/adminPages/ProductsAdminPage/ProductDetailsAdminPage';
import ProductCategoryAdminPage from 'pages/adminPages/ProductCategoryAdminPage/ProductCategoryAdminPage';
import ProductCategoryDetailsAdminPage from 'pages/adminPages/ProductCategoryAdminPage/ProductCategoryDetailsAdminPage';
import ExpertsAdminPage from 'pages/adminPages/ExpertsAdminPage';
import ResourcesAdminPage from 'pages/adminPages/ResourcesAdminPage';
import QuizzesAdminPage from 'pages/adminPages/QuizzesAdminPage';
import TagsAdminPage from 'pages/adminPages/TagsAdminPage';
import UsersAdminPage from 'pages/adminPages/UsersAdminPage';
import SettingsAdminPage from 'pages/adminPages/SettingsAdminPage';
import ActivityAdminPage from 'pages/adminPages/ActivityAdminPage';
import CongratsAdminPage from 'pages/adminPages/CongratsAdminPage';
import FilterAdminPage from 'pages/adminPages/FilterAdminPage/FilterAdminPage';
import FilterDetailsAdminPage from 'pages/adminPages/FilterAdminPage/FilterDetailsAdminPage';

import ExpertsFaqPage from 'pages/adminPages/ExpertsAdminPage/ExpertsFaqPage';
import SignInAdminPage from 'pages/adminPages/SignInAdminPage';
import DashboardAdminPage from 'pages/adminPages/DashboardAdminPage';
import ExpertDetailsPage from 'pages/adminPages/ExpertsAdminPage/ExpertDetailsPage';
import ExpertsGuidebookPage from 'pages/adminPages/ExpertsAdminPage/ExpertsGuidebookPage';
import ExpertCreatePage from 'pages/adminPages/ExpertsAdminPage/ExpertCreatePage';
import AdminLayout from 'layouts/adminLayout/AdminLayout';
import UserCreatePage from 'pages/adminPages/UserAdminPage/UserCreatePage';
import ResourcesDetailsPage from 'pages/adminPages/ResourcesAdminPage/ResourcesDetailsPage';
import ResourcesCreatePage from 'pages/adminPages/ResourcesAdminPage/ResourcesCreatePage';
// import QuizzesDetailsPage from 'pages/adminPages/QuizzesAdminPage/QuizzesDetailsPage';
import QuizzesCreatePage from 'pages/adminPages/QuizzesAdminPage/QuizzesCreatePage';
import TagsProductCategory from 'pages/adminPages/TagsAdminPage/TagsProductCategory';
import TagsFaqPage from 'pages/adminPages/TagsAdminPage/TagsFaqPage';
import TagsCreateProduct from 'pages/adminPages/TagsAdminPage/TagsCreateProduct';
import TagsCreateFilterRange from 'pages/adminPages/TagsAdminPage/TagsCreateFilterRange';
import TagsQuizzesPage from 'pages/adminPages/TagsAdminPage/TagsQuizzesPage';
import TagsCreateQuiz from 'pages/adminPages/TagsAdminPage/TagsCreateQuiz';
import RewardsAdminPage from 'pages/adminPages/RewardsAdminPage';
import RewardsCreatePage from 'pages/adminPages/RewardsAdminPage/RewardsCreatePage';
import UserDetailsPage from 'pages/adminPages/UserAdminPage/UserDetailsPage';
import TagsCreateFaq from 'pages/adminPages/TagsAdminPage/TagsCreateFaq';
import TagsFilterPage from 'pages/adminPages/TagsAdminPage/TagsFilterPage';
import TagsCreateRewards from 'pages/adminPages/TagsAdminPage/TagsCreateRewards';
import TagsRewardsPage from 'pages/adminPages/TagsAdminPage/TagsRewardsPage';
import { ProtectedRoute } from 'components/route/privateRoute';
import { PublicRoute } from 'components/route/publicRoute';
import PartnerPublishedView from 'pages/adminPages/PartnersAdminPage/PartnerPublishedViewPage'
import ProductPublishedView from 'pages/adminPages/ProductsAdminPage/ProductPublishedViewPage'
import ProductCategoryPublishedViewPage from 'pages/adminPages/ProductCategoryAdminPage/ProductCategoryPublishedViewPage'
import ResourcesPublishedViewPage from 'pages/adminPages/ResourcesAdminPage/ResourcesPublishedViewPage'
import RewardsPublishedViewPage from 'pages/adminPages/RewardsAdminPage/RewardsPublishedViewPage'
import QuizzesPublishedViewPage from 'pages/adminPages/QuizzesAdminPage/QuizzesPublishedViewPage'
import ExpertPublishedViewPage from 'pages/adminPages/ExpertsAdminPage/ExpertPublishedViewPage'
import FaqPublishedViewPage from 'pages/adminPages/ExpertsAdminPage/FaqPublishedViewPage'
import TagsAllProductCategory from 'pages/adminPages/TagsAdminPage/TagsAllProductCategory'
import NotificationsAdminPage from 'pages/adminPages/NotificationsAdminPage'
import QuizThemeAdminPage from 'pages/adminPages/QuizThemeAdminPage'
import NotificationsCreateAdminPage from 'pages/adminPages/NotificationsAdminPage/NotificationsCreateAdminPage'
import QuizThemeCreateAdminPage from 'pages/adminPages/QuizThemeAdminPage/QuizThemeCreateAdminPage'
import QuizThemePublishedViewPage from 'pages/adminPages/QuizThemeAdminPage/QuizThemePublishedViewPage'
import FaqCreatePage from 'pages/adminPages/ExpertsAdminPage/FaqCreatePage'
import TailoredNotificationAdminPage from 'pages/adminPages/NotificationsAdminPage/TailoredNotificationAdminPage'
import TailoredNotificationCreatePage from 'pages/adminPages/NotificationsAdminPage/TailoredNotificationCreatePage'
import StatsAdminPage from 'pages/adminPages/StatsAdminPage';
import ProductStatsPage from 'pages/adminPages/StatsAdminPage/ProductStatsPage';

const routes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
        <Route path="/dashboard" element={<DashboardAdminPage />} />
        <Route path="/partners" element={<PartnersAdminPage />} />
        <Route path="/partners/create" element={<PartnerCreateAdminPage />} />
        <Route path="/partners/create/:id" element={<PartnerCreateAdminPage />} />
        <Route path="/partners/published/:id/current" element={<PartnerPublishedView />} />
        <Route path="/partners/published/:id/published" element={<PartnerPublishedView />} />
        <Route path="/partners/details/:id" element={<PartnerDetailsAdminPage />} />
        <Route
          path="/products/category/:categoryId/provider/:providerId"
          element={<SpecificProducts />}
        />
        <Route path="/products" element={<ProductsAdminPage />} />
        <Route path="/products/category/:categoryId" element={<SpecificProducts />} />,
        <Route path="/products/:id" element={<ProductDetailsAdminPage />} />,
        <Route path="/products/published/:id/current" element={<ProductPublishedView />} />
        <Route path="/products/published/:id/published" element={<ProductPublishedView />} />
        <Route
          path="/products/create/:id/category/:categoryId"
          element={<ProductDetailsAdminPage />}
        />
        <Route path="/product-category" element={<ProductCategoryAdminPage />} />
        <Route path="/product-category/:id" element={<ProductCategoryDetailsAdminPage />} />
        <Route
          path="/product-category/published/:id/current"
          element={<ProductCategoryPublishedViewPage />}
        />
        <Route
          path="/product-category/published/:id/published"
          element={<ProductCategoryPublishedViewPage />}
        />
        <Route path="/experts" element={<ExpertsAdminPage />} />
        {/* <Route path="/experts/faq" element={<ExpertsFaqPage />} /> */}
        <Route path="/experts/:id/faq" element={<ExpertsFaqPage />} />
        <Route path="/experts/:id/faq/:fid" element={<FaqCreatePage />} />
        <Route path="/experts/:id/faq/:fid" element={<FaqCreatePage />} />
        <Route path="/experts/published/:id/faq/current" element={<FaqPublishedViewPage />} />
        <Route path="/experts/published/:id/faq/published" element={<FaqPublishedViewPage />} />
        <Route path="/experts/:id" element={<ExpertDetailsPage />} />
        <Route path="/experts/published/:id/current" element={<ExpertPublishedViewPage />} />
        <Route path="/experts/published/:id/published" element={<ExpertPublishedViewPage />} />
        {/* <Route path="/experts/guidebook" element={<ExpertsGuidebookPage />} /> */}
        <Route path="/experts/:id/guidebook" element={<ExpertsGuidebookPage />} />
        <Route path="/experts/add" element={<ExpertCreatePage />} />
        <Route path="/resources" element={<ResourcesAdminPage />} />
        <Route path="/resources/:id" element={<ResourcesDetailsPage />} />
        <Route path="/resources/published/:id/current" element={<ResourcesPublishedViewPage />} />
        <Route path="/resources/published/:id/published" element={<ResourcesPublishedViewPage />} />
        <Route path="/resources/add" element={<ResourcesCreatePage />} />
        <Route path="/quizzes/" element={<QuizzesAdminPage />} />
        {/* <Route path="/quizzes/:id" element={<QuizzesDetailsPage />} /> */}
        <Route path="/quizzes/:id" element={<QuizzesCreatePage />} />
        <Route path="/quizzes/published/:id/current" element={<QuizzesPublishedViewPage />} />
        <Route path="/quizzes/published/:id/published" element={<QuizzesPublishedViewPage />} />
        <Route path="/quizzes/add" element={<QuizzesCreatePage />} />
        <Route path="/tags" element={<TagsAdminPage />} />
        <Route path="/tags/products" element={<TagsAllProductCategory />} />
        <Route path="/tags/product/:id" element={<TagsProductCategory />} />
        <Route path="/tags/quizzes" element={<TagsQuizzesPage />} />
        <Route path="/tags/quizzes/:id" element={<TagsCreateQuiz />} />
        <Route path="/tags/quizzes/:id" element={<TagsCreateQuiz />} />
        <Route path="/tags/rewards/:id" element={<TagsCreateRewards />} />
        <Route path="/tags/rewards/:id" element={<TagsCreateRewards />} />
        <Route path="/tags/reward" element={<TagsRewardsPage />} />
        <Route path="/tags/faq" element={<TagsFaqPage />} />
        <Route path="/tags/faq/:id" element={<TagsCreateFaq />} />
        <Route path="/tags/faq/:id" element={<TagsCreateFaq />} />
        <Route path="/tags/product/add/:id" element={<TagsCreateProduct />} />
        <Route path="/tags/product/add/:id" element={<TagsCreateProduct />} />
        <Route path="/tags/filter/:id" element={<TagsCreateFilterRange />} />
        <Route path="/tags/filter/:id" element={<TagsCreateFilterRange />} />
        <Route path="/tags/filter" element={<TagsFilterPage />} />
        <Route path="/users" element={<UsersAdminPage />} />
        <Route path="/users/add" element={<UserCreatePage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="/filter" element={<FilterAdminPage />} />
        <Route path="/filter/:id" element={<FilterDetailsAdminPage />} />
        <Route path="/rewards/" element={<RewardsAdminPage />} />
        <Route path="/rewards/:id" element={<RewardsCreatePage />} />
        <Route path="/rewards/:id" element={<RewardsCreatePage />} />
        <Route path="/rewards/published/:id/current" element={<RewardsPublishedViewPage />} />
        <Route path="/rewards/published/:id/published" element={<RewardsPublishedViewPage />} />
        <Route path="/settings" element={<SettingsAdminPage />} />
        <Route path="/activity" element={<ActivityAdminPage />} />
        <Route path="/stats" element={<StatsAdminPage />} />
        <Route path="/stats/products" element={<ProductStatsPage />} />
        <Route path="/congrats" element={<CongratsAdminPage />} />
        <Route path="/notifications" element={<NotificationsAdminPage />} />
        <Route path="/quiz-theme" element={<QuizThemeAdminPage />} />
        <Route path="/push/:id" element={<NotificationsCreateAdminPage />} />
        <Route path="/tailored" element={<TailoredNotificationAdminPage />} />
        <Route path="/tailored/:type" element={<TailoredNotificationCreatePage />} />
        <Route path="/quiz-theme/:id" element={<QuizThemeCreateAdminPage />} />
        <Route path="/quiz-theme/published/:id/current" element={<QuizThemePublishedViewPage />} />
        <Route
          path="/quiz-theme/published/:id/published"
          element={<QuizThemePublishedViewPage />}
        />
      </Route>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <SignInAdminPage />
          </PublicRoute>
        }
      />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  )
}

export default routes;
