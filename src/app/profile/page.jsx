'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import AirportInput from '@/components/AirportInput';

export default function ProfilePage() {
    const { user } = useAuth();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const interestOptions = ['Beaches', 'Hiking', 'Food', 'Nightlife', 'Museums', 'Road Trips'];

    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) setForm(snap.data());
        };
        fetch();
    }, [user]);

    const toggleInterest = (tag) => {
        if (!form) return;
        const current = form.interests || [];
        setForm({
            ...form,
            interests: current.includes(tag)
                ? current.filter(i => i !== tag)
                : [...current, tag],
        });
    };

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSaving(true);
        await setDoc(doc(db, 'users', user.uid), form, { merge: true });
        setSaving(false);
        alert('Profile saved!');
    };

    if (!form) return <ProtectedRoute><div className="pt-24 text-center">Loading profile...</div></ProtectedRoute>;

    return (
        <ProtectedRoute>
            <div className="max-w-2xl mx-auto mt-24 p-6 bg-white dark:bg-slate-800 rounded shadow space-y-4">
                <h1 className="text-2xl font-bold">Edit Your Profile</h1>

                <input
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Name"
                    value={form.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                />

                <input
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Phone"
                    value={form.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                />

                <AirportInput
                    value={form.homeAirport}
                    onSelect={(val) => handleChange('homeAirport', val)}
                />

                <input
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Sex"
                    value={form.sex || ''}
                    onChange={(e) => handleChange('sex', e.target.value)}
                />

                <input
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Gender Identity"
                    value={form.genderIdentity || ''}
                    onChange={(e) => handleChange('genderIdentity', e.target.value)}
                />

                <div>
                    <p className="mb-2 font-semibold">Your Interests:</p>
                    <div className="flex flex-wrap gap-2">
                        {interestOptions.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleInterest(tag)}
                                className={`px-3 py-1 rounded-full text-sm ${form.interests?.includes(tag)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-600 text-black dark:text-white'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Bucket List Destinations (comma separated)"
                    value={form.bucketListDestinations?.join(', ') || ''}
                    onChange={(e) =>
                        handleChange('bucketListDestinations', e.target.value.split(',').map(s => s.trim()))
                    }
                />

                <textarea
                    className="w-full p-2 border rounded dark:bg-slate-700"
                    placeholder="Countries Traveled (comma separated)"
                    value={form.countriesTraveled?.join(', ') || ''}
                    onChange={(e) =>
                        handleChange('countriesTraveled', e.target.value.split(',').map(s => s.trim()))
                    }
                />

                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </ProtectedRoute>
    );
}
