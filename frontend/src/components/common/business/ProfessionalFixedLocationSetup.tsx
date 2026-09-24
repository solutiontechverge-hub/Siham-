"use client";

import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Typography } from "../../ui/typography";
import { SectionShell } from "./professionalFixedLocationSetupShell";
import {
  ProfessionalDesiredLocationForm,
  ProfessionalFixedLocationForm,
  type ProfessionalDesiredLocationFormProps,
} from "./ProfessionalLocationForms";
import { ProfessionalManageTeamSection } from "./ProfessionalManageTeamSection";
import { ProfessionalBusinessPoliciesSection } from "./ProfessionalBusinessPoliciesSection";
import { ProfessionalServicesSection } from "./ProfessionalServicesSection";
import { ProfessionalProfileMediaSection } from "./ProfessionalProfileMediaSection";
import { ProfessionalAccountSection } from "./ProfessionalAccountSection";
import { ProfessionalServiceForSection } from "./ProfessionalServiceForSection";
import { ProfessionalPortfolioSection } from "./ProfessionalPortfolioSection";
import { ProfessionalSetupOverlays } from "./ProfessionalSetupOverlays";
import {
  useProfessionalFixedLocationSetup,
  type BusinessSetupSectionId,
  type ProfessionalFixedLocationSetupProps,
} from "./useProfessionalFixedLocationSetup";
import { ProfessionalFixedLocationSetupToolbar } from "./ProfessionalFixedLocationSetupToolbar";
import { ProfessionalFixedLocationSetupSectionEdit } from "./ProfessionalFixedLocationSetupSectionEdit";
import { ProfessionalFixedLocationSetupChrome } from "./ProfessionalFixedLocationSetupChrome";

export type { ProfessionalFixedLocationSetupProps };

export default function ProfessionalFixedLocationSetup(
  props: ProfessionalFixedLocationSetupProps,
) {
  const {
    activeBusinessTemplate,
    activeCategoryExplicitMains,
    activeCategoryFlatSubservices,
    activeServiceCategory,
    activeSubTab,
    addBizKeyword,
    addDesiredArea,
    applyProfessionalDraft,
    applyTemplateSyncSettings,
    biz,
    buildTeamMemberServiceGroups,
    businessCategories,
    businessFormDisabled,
    businessOfferingSelect,
    businessSetupData,
    businessSetupPublishValidation,
    businessStatusMenuAnchor,
    cancelProfessionalEditing,
    cancellationPolicyDisabled,
    chrome,
    data,
    deleteSelectedPortfolio,
    desiredAreaMode,
    desiredAreasByProvince,
    desiredBusiness,
    desiredMunicipalityByProvince,
    desiredMunicipalityDraft,
    desiredProvinceDraft,
    desiredProvinceOptions,
    expandedMainServiceIds,
    expandedServiceDetailIds,
    featureTeamPublic,
    fileInputRef,
    fixedBiz,
    generalNotesDisabled,
    getMemberAssignedServiceIds,
    goNextMedia,
    goPrevMedia,
    groupedServiceSections,
    handleDeleteMainService,
    handleDeleteSubservice,
    handleEditMainService,
    handleEditSubservice,
    isBothOffering,
    isBusinessMediaUploading,
    isBusinessProfileActive,
    isBusinessProfileStatusSaving,
    isBusinessPublishEnabled,
    isBusinessSectionEditing,
    isBusinessSetupSaving,
    isProfessionalDirty,
    isProfessionalEditing,
    isProfileSaving,
    keywordsAtMax,
    locationDisabled,
    locationSectionTitle,
    m,
    manageTeamDisabled,
    mediaDeleteConfirmOpen,
    mediaIdx,
    mediaSlides,
    memberProvidesAllServices,
    noShowPolicyDisabled,
    offeringSelectOptions,
    onAttemptPublishBusinessSetup,
    onChooseProfessionalPhoto,
    onConfirmDeleteMedia,
    onFilesSelected,
    onPortfolioFilesSelected,
    onProfessionalPhotoSelected,
    onPublishBusinessSetup,
    onSaveProfessionalProfile,
    onSwitchActiveBusinessTemplate,
    onToggleBusinessProfileActive,
    onUploadMedia,
    onUploadPortfolio,
    openAddService,
    openAddServiceForCategory,
    openAddSubserviceForItem,
    pendingProfessionalPhoto,
    policyDisabled,
    portfolioDisabled,
    portfolioInputRef,
    portfolioItems,
    priceDisabled,
    professionalDraft,
    professionalFieldsDisabled,
    professionalPhotoInputRef,
    profileDisabled,
    profileErrors,
    publishBlockedByValidation,
    publishConfirmOpen,
    removeBizKeyword,
    removeDesiredProvinceGroup,
    reschedulingPolicyDisabled,
    saveBusinessSection,
    savedProfessionalPhotoSrc,
    selectedPortfolioIds,
    serviceCategoryTabs,
    serviceForDisabled,
    sectionNeedsSyncSource,
    serviceModal,
    servicesDetailsDisabled,
    setActiveServiceCategory,
    setActiveSubTab,
    setBizField,
    setBizServiceFor,
    setBusinessOfferingSelect,
    setBusinessProfileActive,
    setBusinessStatusMenuAnchor,
    setDesiredAreaMode,
    setDesiredBusiness,
    setDesiredMunicipalityDraft,
    setDesiredProvinceDraft,
    setFeatureTeamPublic,
    setField,
    setFixedBizField,
    setIsBusinessPublishEnabled,
    setIsProfessionalEditing,
    setMediaDeleteConfirmOpen,
    setMediaIdx,
    setPendingProfessionalPhoto,
    setProfileErrors,
    setPublishConfirmOpen,
    setPublishableFormField,
    setSavedProfessionalDraft,
    setSavedProfessionalPhotoSrc,
    setTeamServiceMenu,
    setTemplateSyncDraft,
    setTemplateSyncDrawerOpen,
    setTemplateSyncModalOpen,
    showDesiredLocationSection,
    showFixedLocationSection,
    showKilometerAllowance,
    showProjectSection,
    showSnackbar,
    startBusinessSectionEdit,
    teamMemberModal,
    teamMembers,
    teamServiceMenu,
    templateSyncDraft,
    templateSyncDrawerOpen,
    templateSyncModalOpen,
    templateSyncSettings,
    theme,
    toPersistedTeamMemberId,
    toggleMainServiceExpand,
    togglePortfolio,
    toggleServiceDetailExpand,
    values,
    visibleLocationCards,
  } = useProfessionalFixedLocationSetup(props);

  const isFreelancer = values.companyBusinessType === "freelancer";
  const fixedLocationForm = (
    <ProfessionalFixedLocationForm
      m={m}
      fixedBiz={{
        salonName: fixedBiz.salonName || fixedBiz.profileName,
        streetAddress: fixedBiz.streetAddress,
        streetNumber: fixedBiz.streetNumber,
        postalCode: fixedBiz.postalCode,
        province: fixedBiz.province,
        municipalities: fixedBiz.municipalities,
      }}
      setFixedBizField={setFixedBizField}
      showSalonName={isFreelancer}
      onSalonNameChange={(value) => setBizField("profileName", value)}
      locationDisabled={locationDisabled}
      desiredMunicipalityByProvince={desiredMunicipalityByProvince as Record<string, string[]>}
      desiredProvinceOptions={desiredProvinceOptions}
    />
  );
  const desiredLocationForm = (
    <ProfessionalDesiredLocationForm
      m={m}
      locationDisabled={locationDisabled}
      desiredAreaMode={desiredAreaMode}
      setDesiredAreaMode={setDesiredAreaMode}
      setDesiredProvinceDraft={setDesiredProvinceDraft}
      setDesiredMunicipalityDraft={setDesiredMunicipalityDraft}
      desiredBusiness={desiredBusiness}
      setDesiredBusiness={
        setDesiredBusiness as ProfessionalDesiredLocationFormProps["setDesiredBusiness"]
      }
      setIsBusinessPublishEnabled={setIsBusinessPublishEnabled}
      desiredProvinceDraft={desiredProvinceDraft}
      desiredMunicipalityDraft={desiredMunicipalityDraft}
      desiredProvinceOptions={desiredProvinceOptions}
      desiredMunicipalityByProvince={desiredMunicipalityByProvince}
      addDesiredArea={addDesiredArea}
      desiredAreasByProvince={desiredAreasByProvince}
      removeDesiredProvinceGroup={removeDesiredProvinceGroup}
    />
  );
  const userInfoContent = (
    <ProfessionalAccountSection
      m={m}
      values={values}
      setField={setField}
      profileErrors={profileErrors}
      setProfileErrors={setProfileErrors}
      professionalFieldsDisabled={professionalFieldsDisabled}
      professionalPhotoInputRef={professionalPhotoInputRef}
      onChooseProfessionalPhoto={onChooseProfessionalPhoto}
      onProfessionalPhotoSelected={onProfessionalPhotoSelected}
      isProfessionalEditing={isProfessionalEditing}
      isProfessionalDirty={isProfessionalDirty}
      isProfileSaving={isProfileSaving}
      cancelProfessionalEditing={cancelProfessionalEditing}
      onSaveProfessionalProfile={onSaveProfessionalProfile}
      pendingProfessionalPhoto={pendingProfessionalPhoto}
      setPendingProfessionalPhoto={setPendingProfessionalPhoto}
      professionalDraft={professionalDraft}
      savedProfessionalPhotoSrc={savedProfessionalPhotoSrc}
      setSavedProfessionalDraft={setSavedProfessionalDraft}
      setSavedProfessionalPhotoSrc={setSavedProfessionalPhotoSrc}
      applyProfessionalDraft={applyProfessionalDraft}
      setIsProfessionalEditing={setIsProfessionalEditing}
    />
  );


  const renderSectionEditAction = (
    sectionId: BusinessSetupSectionId,
    extra?: React.ReactNode,
  ) => (
    <ProfessionalFixedLocationSetupSectionEdit
      m={m}
      sectionId={sectionId}
      extra={extra}
      isBusinessSectionEditing={isBusinessSectionEditing}
      saveBusinessSection={saveBusinessSection}
      startBusinessSectionEdit={startBusinessSectionEdit}
      isBusinessSetupSaving={isBusinessSetupSaving}
    />
  );

  const businessSetupContent = (
    <Stack spacing={2}>
      <ProfessionalFixedLocationSetupToolbar
        m={m}
        data={data}
        businessOfferingSelect={businessOfferingSelect}
        setBusinessOfferingSelect={setBusinessOfferingSelect}
        onSwitchActiveBusinessTemplate={onSwitchActiveBusinessTemplate}
        setIsBusinessPublishEnabled={setIsBusinessPublishEnabled}
        setTemplateSyncModalOpen={setTemplateSyncModalOpen}
        businessFormDisabled={businessFormDisabled}
        offeringSelectOptions={offeringSelectOptions}
        isBothOffering={isBothOffering}
        templateSyncSettings={templateSyncSettings}
        setTemplateSyncDraft={setTemplateSyncDraft}
        setTemplateSyncDrawerOpen={setTemplateSyncDrawerOpen}
        onAttemptPublishBusinessSetup={onAttemptPublishBusinessSetup}
        isBusinessPublishEnabled={isBusinessPublishEnabled}
        isBusinessSetupSaving={isBusinessSetupSaving}
        publishBlockedByValidation={publishBlockedByValidation}
        businessSetupPublishValidation={businessSetupPublishValidation}
        visibleLocationCards={visibleLocationCards}
        activeBusinessTemplate={activeBusinessTemplate}
        businessStatusMenuAnchor={businessStatusMenuAnchor}
        setBusinessStatusMenuAnchor={setBusinessStatusMenuAnchor}
        isBusinessProfileStatusSaving={isBusinessProfileStatusSaving}
        setBusinessProfileActive={setBusinessProfileActive}
        isBusinessProfileActive={isBusinessProfileActive}
        onToggleBusinessProfileActive={onToggleBusinessProfileActive}
      />

      <ProfessionalProfileMediaSection
        m={m}
        data={data}
        action={renderSectionEditAction("profile")}
        mediaSlides={mediaSlides}
        mediaIdx={mediaIdx}
        setMediaIdx={setMediaIdx}
        goPrevMedia={goPrevMedia}
        goNextMedia={goNextMedia}
        setMediaDeleteConfirmOpen={setMediaDeleteConfirmOpen}
        profileDisabled={profileDisabled}
        isBusinessMediaUploading={isBusinessMediaUploading}
        fileInputRef={fileInputRef}
        onFilesSelected={onFilesSelected}
        onUploadMedia={onUploadMedia}
        biz={biz}
        setBizField={(key, value) => setBizField(key, value as never)}
        addBizKeyword={addBizKeyword}
        removeBizKeyword={removeBizKeyword}
        keywordsAtMax={keywordsAtMax}
        showSalonName={!isFreelancer}
      />

      <SectionShell
        title={
          <Typography
            sx={{
              fontWeight: 700,
              color: alpha(m.navy, 0.9),
              fontSize: 30,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isBothOffering ? activeBusinessTemplate : locationSectionTitle}
          </Typography>
        }
        action={renderSectionEditAction("location")}
      >
        {showFixedLocationSection ? fixedLocationForm : null}
        {showDesiredLocationSection ? desiredLocationForm : null}
      </SectionShell>

      <ProfessionalServiceForSection
        m={m}
        action={renderSectionEditAction("serviceFor")}
        serviceFor={biz.serviceFor}
        serviceForDisabled={serviceForDisabled}
        setBizServiceFor={setBizServiceFor}
      />

      <ProfessionalServicesSection
        m={m}
        title={data.servicesDetails.title}
        serviceCategoryTabs={serviceCategoryTabs}
        activeServiceCategory={activeServiceCategory}
        setActiveServiceCategory={setActiveServiceCategory}
        groupedServiceSections={groupedServiceSections}
        activeCategoryExplicitMains={activeCategoryExplicitMains}
        activeCategoryFlatSubservices={activeCategoryFlatSubservices}
        expandedServiceDetailIds={expandedServiceDetailIds}
        expandedMainServiceIds={expandedMainServiceIds}
        toggleServiceDetailExpand={toggleServiceDetailExpand}
        toggleMainServiceExpand={toggleMainServiceExpand}
        serviceModal={serviceModal}
        openAddService={openAddService}
        openAddServiceForCategory={openAddServiceForCategory}
        openAddSubserviceForItem={openAddSubserviceForItem}
        handleEditSubservice={handleEditSubservice}
        handleDeleteSubservice={handleDeleteSubservice}
        handleEditMainService={handleEditMainService}
        handleDeleteMainService={handleDeleteMainService}
        isBusinessSetupSaving={isBusinessSetupSaving}
        servicesDetailsDisabled={servicesDetailsDisabled}
        showProjectSection={showProjectSection}
        biz={biz}
        setBizField={(key, value) => setBizField(key, value as never)}
      />

      <ProfessionalManageTeamSection
        m={m}
        title={data.manageTeam.title}
        featureTeamPublic={featureTeamPublic}
        setFeatureTeamPublic={setFeatureTeamPublic}
        manageTeamDisabled={manageTeamDisabled}
        teamMembers={teamMembers}
        teamMemberModal={teamMemberModal}
        businessSetupId={businessSetupData?.id}
        toPersistedTeamMemberId={toPersistedTeamMemberId}
        getMemberAssignedServiceIds={getMemberAssignedServiceIds}
        memberProvidesAllServices={memberProvidesAllServices}
        buildTeamMemberServiceGroups={buildTeamMemberServiceGroups}
        teamServiceMenu={teamServiceMenu}
        setTeamServiceMenu={setTeamServiceMenu}
      />

      <ProfessionalBusinessPoliciesSection
        m={m}
        data={data}
        biz={biz}
        values={values}
        setBizField={(key, value) => setBizField(key, value as never)}
        setPublishableFormField={setPublishableFormField}
        renderSectionEditAction={renderSectionEditAction}
        generalNotesDisabled={generalNotesDisabled}
        priceDisabled={priceDisabled}
        policyDisabled={policyDisabled}
        reschedulingPolicyDisabled={reschedulingPolicyDisabled}
        cancellationPolicyDisabled={cancellationPolicyDisabled}
        noShowPolicyDisabled={noShowPolicyDisabled}
        showKilometerAllowance={showKilometerAllowance}
      />

      <ProfessionalPortfolioSection
        m={m}
        theme={theme}
        portfolioItems={portfolioItems}
        selectedPortfolioIds={selectedPortfolioIds}
        portfolioDisabled={portfolioDisabled}
        portfolioInputRef={portfolioInputRef}
        deleteSelectedPortfolio={deleteSelectedPortfolio}
        onUploadPortfolio={onUploadPortfolio}
        onPortfolioFilesSelected={onPortfolioFilesSelected}
        togglePortfolio={togglePortfolio}
      />
    </Stack>
  );


  const inner = (
    <ProfessionalFixedLocationSetupChrome
      m={m}
      data={data}
      activeSubTab={activeSubTab}
      setActiveSubTab={setActiveSubTab}
      isBusinessPublishEnabled={isBusinessPublishEnabled}
      setIsProfessionalEditing={setIsProfessionalEditing}
      businessSetupContent={businessSetupContent}
      userInfoContent={userInfoContent}
    />
  );


  const innerWithDrawer = (
    <>
      {inner}
      <ProfessionalSetupOverlays
        m={m}
        publishLabel={data.publishLabel}
        publishConfirmOpen={publishConfirmOpen}
        setPublishConfirmOpen={setPublishConfirmOpen}
        isBusinessSetupSaving={isBusinessSetupSaving}
        publishBlockedByValidation={publishBlockedByValidation}
        onPublishBusinessSetup={onPublishBusinessSetup}
        mediaDeleteConfirmOpen={mediaDeleteConfirmOpen}
        setMediaDeleteConfirmOpen={setMediaDeleteConfirmOpen}
        onConfirmDeleteMedia={onConfirmDeleteMedia}
        templateSyncModalOpen={templateSyncModalOpen}
        setTemplateSyncModalOpen={setTemplateSyncModalOpen}
        templateSyncDrawerOpen={templateSyncDrawerOpen}
        setTemplateSyncDrawerOpen={setTemplateSyncDrawerOpen}
        templateSyncDraft={templateSyncDraft}
        setTemplateSyncDraft={setTemplateSyncDraft}
        applyTemplateSyncSettings={applyTemplateSyncSettings}
        sectionNeedsSyncSource={sectionNeedsSyncSource}
        businessFormDisabled={businessFormDisabled}
        setBusinessOfferingSelect={setBusinessOfferingSelect}
        onSwitchActiveBusinessTemplate={onSwitchActiveBusinessTemplate}
        setIsBusinessPublishEnabled={setIsBusinessPublishEnabled}
        showSnackbar={showSnackbar}
        manageTeamDisabled={manageTeamDisabled}
        businessCategories={businessCategories ?? []}
        teamMemberModal={teamMemberModal}
        serviceModal={serviceModal}
      />
    </>
  );

  if (!chrome) return innerWithDrawer;

  return (
    <Box sx={{ bgcolor: "mollure.pageBg", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack spacing={2}>{innerWithDrawer}</Stack>
      </Container>
    </Box>
  );
}
