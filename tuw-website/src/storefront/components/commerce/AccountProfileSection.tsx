'use client';

import React, { useState } from 'react';
import Input from '@storefront/components/ui/Input';
import Button from '@storefront/components/ui/Button';
import Badge from '@storefront/components/ui/Badge';
import type { useAccount } from '@storefront/lib/account';
import {
  changePasswordAction,
  addMemberAction,
  removeMemberAction,
  leaveHouseholdAction,
  inviteToHouseholdAction,
  revokeHouseholdInviteAction,
} from '@/server/customer-actions';

type Account = ReturnType<typeof useAccount>;

const Notice = ({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) => (
  <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3.5 py-3 text-sm ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-store-card-border bg-store-cream text-store-text-primary'}`}>
    {children}
  </p>
);

/** Profile, password and household — the account "Profile" tab (TL-BE-03). */
export default function AccountProfileSection({ account }: { account: Account }) {
  const data = account.account;
  const profile = data?.profile;
  const household = data?.household;

  // ---- details
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [dob, setDob] = useState(profile?.dateOfBirth ?? '');
  const [detailsMsg, setDetailsMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  // ---- password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // ---- household
  const [memberFirst, setMemberFirst] = useState('');
  const [memberLast, setMemberLast] = useState('');
  const [memberDob, setMemberDob] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteKey, setInviteKey] = useState(() => `hh-${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const [householdMsg, setHouseholdMsg] = useState<{ tone: 'error' | 'ok'; text: string; link?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile || !household) return null;
  const isManager = household.myRole === 'manager';

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingDetails) return;
    setSavingDetails(true);
    const outcome = await account.updateProfile({ firstName, lastName, phone: phone || null, dateOfBirth: dob || null });
    setSavingDetails(false);
    setDetailsMsg(outcome.ok ? { tone: 'ok', text: 'Your details are saved.' } : { tone: 'error', text: outcome.message });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;
    setSavingPassword(true);
    const result = await changePasswordAction({ currentPassword, newPassword });
    setSavingPassword(false);
    if (!result.ok) return setPasswordMsg({ tone: 'error', text: result.error.message });
    setCurrentPassword('');
    setNewPassword('');
    setPasswordMsg({ tone: 'ok', text: 'Password changed. Other devices were signed out.' });
  };

  const householdAction = async <T,>(work: () => Promise<{ ok: true; data: T } | { ok: false; error: { message: string } }>, onOk: (data: T) => void) => {
    if (busy) return;
    setBusy(true);
    const result = await work();
    setBusy(false);
    if (!result.ok) return setHouseholdMsg({ tone: 'error', text: result.error.message });
    onOk(result.data);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <section aria-labelledby="profile-heading" className="bg-store-surface border border-store-card-border p-6 sm:p-8 space-y-5">
        <h2 id="profile-heading" className="font-heading text-xl font-medium text-store-charcoal pb-3 border-b border-store-card-border">Profile</h2>
        <form onSubmit={saveDetails} className="space-y-4" noValidate>
          {detailsMsg && <Notice tone={detailsMsg.tone}>{detailsMsg.text}</Notice>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </div>
          <Input label="Email" value={profile.email} readOnly helperText={profile.emailVerified ? 'Confirmed' : 'Not confirmed yet — check your inbox for the confirmation link.'} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Date of birth (optional)" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <Button variant="dark" size="sm" type="submit" disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save details'}</Button>
        </form>
      </section>

      <section aria-labelledby="password-heading" className="bg-store-surface border border-store-card-border p-6 sm:p-8 space-y-4">
        <h2 id="password-heading" className="font-heading text-lg font-medium text-store-charcoal">Password</h2>
        <form onSubmit={savePassword} className="space-y-4" noValidate>
          {passwordMsg && <Notice tone={passwordMsg.tone}>{passwordMsg.text}</Notice>}
          <Input label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New password" type="password" autoComplete="new-password" helperText="At least 8 characters." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button variant="secondary" size="sm" type="submit" disabled={savingPassword}>{savingPassword ? 'Changing…' : 'Change password'}</Button>
        </form>
      </section>

      <section aria-labelledby="household-heading" className="bg-store-surface border border-store-card-border p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h2 id="household-heading" className="font-heading text-lg font-medium text-store-charcoal">Household</h2>
          <p className="text-sm text-store-text-secondary">Shop for family members and keep their sizes in one place. Addresses stay private to each person.</p>
        </div>
        {householdMsg && (
          <Notice tone={householdMsg.tone}>
            {householdMsg.text}{' '}
            {householdMsg.link && <a href={householdMsg.link} className="underline break-all">{householdMsg.link}</a>}
          </Notice>
        )}
        <ul className="divide-y divide-store-card-border border-y border-store-card-border">
          {household.members.map((m) => (
            <li key={m.profileId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-store-charcoal">{m.firstName} {m.lastName}{m.isMe ? ' (you)' : ''}</p>
                <p className="text-xs text-store-text-secondary">{m.canLogIn ? 'Has their own login' : 'Managed by you — no login'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.role === 'manager' ? 'dark' : 'neutral'}>{m.role === 'manager' ? 'Manager' : 'Member'}</Badge>
                {isManager && !m.isMe && (
                  <Button variant="ghost" size="sm" disabled={busy} aria-label={`Remove ${m.firstName} from the household`}
                    onClick={() => void householdAction(() => removeMemberAction({ profileId: m.profileId }), (h) => { account.setHousehold(h); setHouseholdMsg({ tone: 'ok', text: `${m.firstName} was removed. Their orders and sizes are kept.` }); })}>
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {isManager && (
          <>
            <form
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void householdAction(() => addMemberAction({ firstName: memberFirst, lastName: memberLast, dateOfBirth: memberDob || null }), (h) => {
                  account.setHousehold(h);
                  setMemberFirst(''); setMemberLast(''); setMemberDob('');
                  setHouseholdMsg({ tone: 'ok', text: 'Family member added. You can now order for them.' });
                });
              }}
            >
              <Input label="First name" value={memberFirst} onChange={(e) => setMemberFirst(e.target.value)} />
              <Input label="Last name" value={memberLast} onChange={(e) => setMemberLast(e.target.value)} />
              <Input label="Date of birth" type="date" value={memberDob} onChange={(e) => setMemberDob(e.target.value)} />
              <div className="sm:col-span-3"><Button variant="secondary" size="sm" type="submit" disabled={busy}>Add family member</Button></div>
            </form>

            <form
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void householdAction(() => inviteToHouseholdAction({ email: inviteEmail, idempotencyKey: inviteKey }), (r) => {
                  setHouseholdMsg({ tone: 'ok', text: r.devLink ? `Invitation created for ${inviteEmail}. Email is not connected yet (development):` : `Invitation sent to ${inviteEmail}.`, link: r.devLink ?? undefined });
                  setInviteEmail('');
                  setInviteKey(`hh-${Math.random().toString(36).slice(2)}-${Date.now()}`);
                });
              }}
            >
              <div className="flex-1"><Input label="Invite someone with their own account" type="email" placeholder="name@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
              <Button variant="secondary" size="sm" type="submit" disabled={busy}>Send invite</Button>
            </form>

            {(data?.invites.length ?? 0) > 0 && (
              <ul className="space-y-2" aria-label="Pending invitations">
                {data!.invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-store-text-secondary">Invited {i.email}</span>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void householdAction(() => revokeHouseholdInviteAction({ inviteId: i.id }), () => setHouseholdMsg({ tone: 'ok', text: `Invitation for ${i.email} revoked.` }))}>Revoke</Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {household.members.length > 1 && (
          <Button variant="ghost" size="sm" disabled={busy}
            onClick={() => void householdAction(() => leaveHouseholdAction({}), (h) => { account.setHousehold(h); setHouseholdMsg({ tone: 'ok', text: 'You left the household. Your orders and sizes stay with you.' }); })}>
            Leave household
          </Button>
        )}
      </section>
    </div>
  );
}
