import { useState, useEffect } from "react";

function UserProfile() {
    const [profileForm, setProfileForm] = useState({
        username: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        console.log("Cập nhật thông tin profile:", profileForm);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        console.log("Đổi mật khẩu:", passwordForm);
    };

    useEffect(() => {
        console.log("Profile form hiện tại:", profileForm);
    }, [profileForm]);

    return (
        <div>
            <h1>USER PROFILE</h1>

            <section>
                <h2>Profile</h2>
                <form onSubmit={handleProfileSubmit}>
                    <div>
                        <label>Username:</label><br />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={profileForm.username}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <button type="submit">Update</button>
                </form>
            </section>

            <hr />

            <section>
                <h2>Change password</h2>
                <form onSubmit={handlePasswordSubmit}>
                    <div>
                        <label>Current password:</label><br />
                        <input
                            type="password"
                            name="currentPassword"
                            placeholder="Current Password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <br />

                    <div>
                        <label>New password:</label><br />
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <br />

                    <div>
                        <label>Confirm new password:</label><br />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <br />

                    <button type="submit">Change</button>
                </form>
            </section>
        </div>
    );
}

export default UserProfile;
