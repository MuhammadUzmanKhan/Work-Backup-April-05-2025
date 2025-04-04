import { Button, Card, Form, Input, Modal, Switch, Table, Typography } from "antd"
import * as Yup from "yup"
import { Formik } from "formik"
import { customNotification } from "../../components";
import { useEffect, useState } from "react";
import extensionRelasesTable from "../../components/tables/extension-releases-table";
import { apis } from "../../services";


const ExtensionReleases = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [releases, setReleases] = useState<any[]>([]);

    const fetchReleases = async () => {
        try {
            const response = await apis.allextensionRelases();
            setReleases(response?.data?.extensionReleases);
        } catch (error: any) {
            customNotification.error(error?.response?.data?.message || "Failed to fetch Extension Releases");
        }
    }

    const handleCreateNotification = async (values: any) => {
        try {
            const response = await apis.createExtensionRelease(values);
            setModalVisible(false);
            customNotification.success(response?.data?.message || "Extension Release created successfully");
            fetchReleases();
        } catch (error: any) {
            customNotification.error(error?.response?.data?.message || "Failed to create Extension Release");
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            const response = await apis.toggelActiveExtensionRelease({ id, isActive });
            customNotification.success(response?.data?.message || "Extension Release updated successfully");
            fetchReleases();
        } catch (error: any) {
            customNotification.error(error?.response?.data?.message || "Failed to update Extension Release");
        }
    }

    const extensionReleasesSchema = Yup.object().shape({
        version: Yup.string().required("Version is required"),
        message: Yup.string().required("Message is required"),
        forced: Yup.boolean().required("Forced is required"),
    });

    useEffect(() => {
        fetchReleases();
    }, []);

    return (
        <div
            className="p-4 h-[100vh]"
        >
            <Typography.Title>Extension Releases</Typography.Title>
            <div
                className="flex justify-end"
            >
                <Button
                    type="primary"
                    className="mb-4"
                    onClick={() => setModalVisible(true)}
                >
                    Create New Release
                </Button>
            </div>
            <Card title="Extension Version Table" className="w-[92vw]">
                <Table
                    columns={extensionRelasesTable({ toggleActive })}
                    dataSource={releases}
                    pagination={false}
                />
            </Card>
            {
                modalVisible && <Modal
                    title="Create New Extension Releases"
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                >
                    <Formik
                        initialValues={{
                            version: "",
                            message: "",
                            releaseDate: "",
                            forced: false,
                        }}
                        validationSchema={extensionReleasesSchema}
                        onSubmit={handleCreateNotification}

                    >
                        {({ handleChange, values, submitForm }) => (
                            <Form
                                layout="vertical"
                                onFinish={submitForm}
                            >
                                <Form.Item
                                    label="Version"
                                    name="version"
                                >
                                    <Input
                                        name="version"
                                        value={values.version}
                                        onChange={handleChange}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Message"
                                    name="message"
                                >
                                    <Input
                                        name="message"
                                        value={values.message}
                                        onChange={handleChange}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Forced"
                                    name="forced"
                                >
                                    <Switch
                                        checked={values.forced}
                                        onChange={(checked) => handleChange({ target: { name: "forced", value: checked } })}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <div
                                        className="flex justify-end"
                                    >
                                        <button
                                            className="px-4 py-2 bg-blue-500 text-white"
                                            type="submit"
                                        >
                                            Create Release
                                        </button>
                                    </div>
                                </Form.Item>
                            </Form>
                        )}
                    </Formik>
                </Modal>
            }
        </div>
    )
}

export default ExtensionReleases;