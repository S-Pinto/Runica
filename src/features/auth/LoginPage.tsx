import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { GoogleIcon } from '../../components/ui/icons';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export const LoginPage: React.FC = () => {
  const { currentUser, signInWithGoogle, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/'); // Redirect to character list after sign-in
    } catch (error) {
      console.error("Error during sign-in:", error);
      // You could show an error message to the user here
    }
  };

  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.displayName || '');
      setPreviewImageUrl(currentUser.photoURL || null);
    }
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setError('');

    try {
      let photoURL = currentUser.photoURL;

      if (newImageFile) {
        const compressedFile = await imageCompression(newImageFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 512,
          useWebWorker: true,
        });

        const storage = getStorage();
        const storageRef = ref(storage, `users/${currentUser.uid}/profile.jpg`);
        await uploadBytes(storageRef, compressedFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, {
        displayName: nickname,
        photoURL: photoURL,
      });

      alert('Profile updated successfully!');
      setNewImageFile(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // Reindirizza alla home page dopo il sign-out per un feedback chiaro.
      navigate('/');
    } catch (error) {
      console.error("Error during sign-out:", error);
      // Potresti mostrare un messaggio di errore all'utente qui
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 text-center">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full border border-border">
        <h1 className="text-3xl font-cinzel text-accent mb-4">
          {currentUser ? `Welcome, ${currentUser.displayName || 'Adventurer'}` : 'Join the Adventure'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {currentUser
            ? 'Manage your account details below or go to your characters.'
            : 'Sign in with Google to sync your characters across devices.'}
        </p>
        {currentUser ? (
          <div className="flex flex-col space-y-4 w-full">
            <div className="flex flex-col items-center gap-4 mb-4">
              <label htmlFor="profile-image-upload" className="cursor-pointer group relative">
                <img
                  src={previewImageUrl || `https://api.dicebear.com/8.x/lorelei/svg?seed=${currentUser.uid}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-accent/50 group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">Change</span>
                </div>
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-muted-foreground text-left mb-1">Nickname</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent sm:text-sm"
              />
            </div>

            <button onClick={handleProfileUpdate} disabled={isSaving} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:text-muted-foreground">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <hr className="border-border my-2" />

            <button onClick={() => navigate('/')} className="px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg shadow-md hover:bg-secondary/80 transition-colors">Go to Your Characters</button>
            <button onClick={handleSignOut} className="px-6 py-3 bg-transparent border border-destructive/50 text-destructive font-bold rounded-lg shadow-md hover:bg-destructive/10 transition-colors">Sign Out</button>
          </div>
        ) : (
          <button onClick={handleSignIn} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white text-zinc-700 font-bold rounded-lg shadow-md hover:bg-zinc-200 transition-colors">
            <GoogleIcon className="w-6 h-6" />
            Sign In with Google
          </button>
        )}
      </div>
    </div>
  );
};