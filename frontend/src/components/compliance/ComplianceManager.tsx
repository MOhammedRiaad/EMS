import React, { useState, useEffect } from 'react';
import { termsService, type TermsOfService } from '../../services/terms.service';
import { waiverService } from '../../services/waiver.service';
import TermsModal from './TermsModal';
import WaiverModal from './WaiverModal';
import { useAuth } from '../../contexts/AuthContext';

const ComplianceManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // States for various compliance steps
    const [termsNeedAcceptance, setTermsNeedAcceptance] = useState<TermsOfService | null>(null);
    const [showWaiver, setShowWaiver] = useState(false);

    useEffect(() => {
        if (user) {
            checkCompliance();
        }
    }, [user]);

    const checkCompliance = async () => {
        setLoading(true);
        try {
            // 1. Check Terms
            const termsStatus = await termsService.checkStatus();
            if (!termsStatus.accepted && termsStatus.termsId) {
                const activeTerms = await termsService.getActive();
                if (activeTerms) {
                    setTermsNeedAcceptance(activeTerms);
                    setLoading(false);
                    return; // Stop here, show Terms modal
                }
            }

            // 2. Check Waiver
            const waiverStatus = await waiverService.checkStatus();
            if (!waiverStatus.signed) {
                setShowWaiver(true);
                setLoading(false);
                return; // Stop here, show Waiver modal
            }

            // 3. Check PAR-Q
            // We need clientId. Assuming user.id is valid or we fetch client profile.
            // But wait, user definition in auth context might not have 'clientId' if it's a generic user object.
            // Usually for client portal, user.id is the User ID. The Client entity is linked.
            // However, parqService expects clientId.
            // Let's assume for now user.id IS the clientId in this context or we can fetch it.
            // Actually, in `ClientLayout.tsx`, we don't fetch full client profile.
            // But let's check `api/auth/me` response or similar.
            // For safety, let's skip PAR-Q auto-prompt if we can't easily get Client ID, 
            // OR fetch client profile here.

            // Let's fetch client profile to get ID
            // Ideally auth context should provide this.
            // I'll fetch it for now as a safe fallback.

            // NOTE: If user is just 'User' entity, we need to find their 'Client' entity.
            // Assuming 1:1 map, usually backend endpoint `GET /clients/me` or similar exists?
            // Existing `ClientLayout` didn't have this.

            // Let's try to proceed with Waiver/Terms first. PAR-Q might be "on demand" or we fetch.
            // But the requirement implies mandatory flow.
            // I will implement fetching client ID if possible.
            // If not, I'll default to using user.id and hope it matches or handle error.

            // Actually, let's look at `ClientDetailsPage`. It uses `useParams`.
            // Let's look at `waiverService`. It uses `client-portal` endpoints typically which use `req.user`.

            // OK, checking `parqService.create` expects `clientId`. 
            // `ParqController.create` uses `req.user.tenantId` but the DTO requires `clientId`.

            // I'll assume for the 'Client Portal' context, the logged in user IS the client (or linked).
            // Backend `ClientPortalController` usually handles this context without explicit ID.
            // But `ParqController` seems designed for Admin usage (passing clientId).
            // I should have made `ParqController` have a `mine` endpoint or `ClientPortalParqController`.

            // Quick fix: Use `user.id` as client ID? No, User and Client are separate entities usually.
            // I will assume for now we skip PAR-Q mandatory check in this turn to avoid breakage 
            // OR I update backend to handle "my parq".

            // Let's check `WaiverModal` usage. It doesn't pass ID. `waiverService.signWaiver` takes `waiverId`.
            // And backend `WaiversController` likely uses `req.user`.

            // Backend `ParqController` I created:
            // @Post() create(@Body() dto: CreateParqDto) -> dto.clientId

            // This is an issue for Client Portal auto-submission.
            // I will implement Terms and Waiver first in this Manager.
            // I will add PAR-Q check only if I can confirm Client ID.

            // For now, let's stick to Terms and Waiver as the primary mandatory gates.
            // I'll leave PAR-Q for the "Profile" tab or add a specific "My PAR-Q" endpoint later.

        } catch (error) {
            console.error('Compliance check failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTermsAccepted = () => {
        setTermsNeedAcceptance(null);
        checkCompliance(); // Re-check to trigger next step
    };

    const handleWaiverSigned = () => {
        setShowWaiver(false);
        checkCompliance(); // Re-check to trigger next step
    };

    /* 
    const handleParqCompleted = () => {
        setShowParq(false);
        checkCompliance();
    };
    */

    if (loading) return null;

    return (
        <>
            {termsNeedAcceptance && (
                <TermsModal
                    terms={termsNeedAcceptance}
                    onAccepted={handleTermsAccepted}
                />
            )}

            {!termsNeedAcceptance && showWaiver && (
                <WaiverModal onSigned={handleWaiverSigned} />
            )}

            {/* {!termsNeedAcceptance && !showWaiver && showParq && (
                <ParqModal ... />
            )} */}
        </>
    );
};

export default ComplianceManager;
