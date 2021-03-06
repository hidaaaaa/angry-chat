import { faChevronLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, Button, Input, notification, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../../component/Loading";
import useWindowSize from "../../customHook/useWindowsSize";
import { auth, firestore, storage } from "../../firebaseConfig/firebase";
import "./style/index.scss";

const UserContent = ({ handleOpenNavbar }) => {
	const { multiFactor } = auth.currentUser;
	const { user } = multiFactor;

	const userRef = firestore.collection("listUser").where("uid", "==", user.uid);
	const [userData, loading] = useCollectionData(userRef, { idField: "id" });
	const [file, setFile] = useState(null);
	const [avatar, setAvatar] = useState("");
	const [username, setUsername] = useState("");
	const [isChangeName, setIsChangeName] = useState(false);

	useEffect(() => {
		(async () => {
			firestore
				.collection("listUser")
				.where("uid", "==", user.uid)
				.get()
				.then((querySnapshot) => {
					querySnapshot.forEach((doc) => {
						setAvatar(doc.data().photoURL);
						setUsername(doc.data().displayName);
					});
				})
				.catch((e) => {
					console.log(e);
					return <Loading text="Lỗi" />;
				});
		})();
	}, []);

	const [size] = useWindowSize();

	const changeOpenNavbar = () => {
		if (handleOpenNavbar) {
			handleOpenNavbar(true);
		}
	};

	const onChangeAvatar = async () => {
		await storage.ref(`images/${user.uid}/${user.uid}`).put(file);

		const pathReference = await storage
			.ref(`images/${user.uid}/${user.uid}`)
			.getDownloadURL();

		console.log(userData);

		await firestore
			.collection("listUser")
			.doc(userData[0].id)
			.update({
				photoURL: pathReference,
			})
			.then(() => {
				user
					.updateProfile({
						photoURL: pathReference,
					})
					.then(() => {
						setFile(null);
						return notification.success({
							message: "Thay đổi hình nền thành công",
						});
					});
			})
			.catch((e) => {
				console.log(e);
				return notification.error({
					message: "Thay đổi thất bại",
				});
			});
	};

	const onCancelChangeAvatar = () => {
		setFile(null);
		setAvatar(userData[0].photoURL);
	};

	const onChangeUsername = async () => {
		auth.currentUser
			.updateProfile({
				displayName: username,
			})
			.then(() => {
				firestore
					.collection("listUser")
					.doc(userData[0].id)
					.update({
						displayName: username,
					})
					.then(() => {
						setIsChangeName(false);
						return notification.success({
							message: "Thay đổi tên thành công",
						});
					});
			})
			.catch((error) => {
				console.log(error);
				return notification.error({
					message: "Thay đổi tên thất bại",
				});
			});
	};

	const onChangeInputValue = (e) => {
		setUsername(e.target.value);
	};

	if (loading) return <Loading />;

	return (
		<div className="user-content">
			<div className="user-content__header">
				{size <= 768 && (
					<div
						className="user-content__header--icon"
						onClick={() => changeOpenNavbar()}
					>
						<FontAwesomeIcon icon={faChevronLeft} />
					</div>
				)}
				<div className="user-content__header--title">Tài khoản</div>
			</div>

			<div className="user-content__body">
				<div className="user-content__body--avatar">
					<Upload
						showUploadList={false}
						onChange={({ file, fileList }) => {
							if (file.status !== "uploading") {
								setFile(file);
								setAvatar(URL.createObjectURL(file));
							}
						}}
						beforeUpload={() => false}
					>
						<Avatar
							src={avatar}
							icon={<FontAwesomeIcon icon={faUser} color="white" />}
							size={100}
						/>
					</Upload>

					{!!file && (
						<div className="user-content__body--avatar__btn">
							<button onClick={onChangeAvatar}>Thay đổi</button>
							<button onClick={onCancelChangeAvatar}>Hủy</button>
						</div>
					)}
				</div>

				<div className="user-content__body--username">
					<div className="user-content__body--username__title">
						Tên người dùng
					</div>
					<Input
						className="user-content__body--username__input"
						value={username}
						disabled={!isChangeName}
						onChange={onChangeInputValue}
						// bordered={false}
					/>
				</div>
				<div className="user-content__body--button">
					{isChangeName ? (
						<>
							<button
								className="user-content__body--button__submit"
								onClick={onChangeUsername}
							>
								Xác nhận
							</button>

							<button
								className="user-content__body--button__cancel"
								onClick={() => {
									setIsChangeName(false);
									setUsername(userData[0]?.displayName);
								}}
							>
								Hủy
							</button>
						</>
					) : (
						<>
							<button
								className="user-content__body--button__change"
								onClick={() => setIsChangeName(true)}
							>
								Đổi
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserContent;
