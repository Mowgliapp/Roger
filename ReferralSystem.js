import { useState, useEffect } from 'react'
import { initUtils } from '@telegram-apps/sdk'

const ReferralSystem = ({ initData, userId, startParam }) => {
  const [userData, setUserData] = useState(null);
  const INVITE_URL = "https://t.me/referral_mowglicoin_bot/start"

  useEffect(() => {
    const checkReferral = async () => {
      if (startParam && userId) {
        try {
          const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, referrerId: startParam }),
          });
          if (!response.ok) throw new Error('Failed to save referral');
        } catch (error) {
          console.error('Error saving referral:', error);
        }
      }
    }

    const fetchUserData = async () => {
      if (userId) {
        try {
          const response = await fetch(`/api/user?userId=${userId}`);
          if (!response.ok) throw new Error('Failed to fetch user data');
          const data = await response.json();
          setUserData(data); // Assume data contains { userName, points }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    }

    checkReferral();
    fetchUserData(); // Fetch user data instead of referrals
  }, [userId, startParam])

  const handleInviteFriend = () => {
    const utils = initUtils()
    const inviteLink = `${INVITE_URL}?startapp=${userId}`
    const shareText = `Join me on this awesome Telegram mini app!`
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`
    utils.openTelegramLink(fullUrl)
  }

  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?startapp=${userId}`
    navigator.clipboard.writeText(inviteLink)
    alert('Invite link copied to clipboard!')
  }

  return (
    <div className="w-full max-w-md">
      {userData && (
        <div className="mb-4">
          <p className="text-green-500">Welcome, {userData.userName}!</p>
          <p className="text-green-500">You have collected {userData.points} points!</p>
        </div>
      )}
      <div className="flex flex-col space-y-4">
        <button
          onClick={handleInviteFriend}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Invite Friend
        </button>
        <button
          onClick={handleCopyLink}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Copy Invite Link
        </button>
      </div>
    </div>
  )
}

export default ReferralSystem;
