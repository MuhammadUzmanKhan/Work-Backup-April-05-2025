import React from "react";
import { Modal, Form, Input, Button, DatePicker, Checkbox } from "antd";
import { Formik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import { INotification } from "../../services/types/common";

interface Props {
    visible: boolean;
    initialValues: INotification;
    loading: boolean;
    onClose: () => void;
    onSubmit: (values: any, { resetForm }: any) => Promise<void>;
}

const NotificationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    notice: Yup.string().required("Notice is required"),
    callToAction: Yup.string().url("Invalid URL").optional().nullable(),
    startDate: Yup.date().required("Start Date is required"),
    endDate: Yup.date().required("End Date is required"),
    visibleOnWeb: Yup.boolean(),
    visibleOnExtension: Yup.boolean(),
});

const NotificationModal: React.FC<Props> = ({ visible, initialValues, loading, onClose, onSubmit }) => {
    
    return (
        <Modal
            open={visible}
            title={initialValues?.id ? "Update Notification" : "Create Notification"}
            onCancel={onClose}
            footer={null}
        >
            <Formik
                key={initialValues?.id ? initialValues?.id : "new"}
                initialValues={initialValues}
                validationSchema={NotificationSchema}
                onSubmit={onSubmit}
            >
                {({ values, handleChange, setFieldValue, handleSubmit, errors, touched }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            label="Title *"
                            validateStatus={errors.title && touched.title ? "error" : ""}
                            help={touched.title && errors.title ? errors.title : null}
                        >
                            <Input showCount maxLength={30} name="title" value={values.title} onChange={handleChange} />
                        </Form.Item>
                        <Form.Item
                            label="Notice *"
                            validateStatus={errors.notice && touched.notice ? "error" : ""}
                            help={touched.notice && errors.notice ? errors.notice : null}
                        >
                            <Input.TextArea showCount maxLength={250} name="notice" value={values.notice} onChange={handleChange} />
                        </Form.Item>
                        <Form.Item
                            label="Call to Action (URL)"
                            validateStatus={errors.callToAction && touched.callToAction ? "error" : ""}
                            help={touched.callToAction && errors.callToAction ? errors.callToAction : null}
                        >
                            <Input name="callToAction" value={values.callToAction} onChange={handleChange} />
                        </Form.Item>
                        <Form.Item
                            label="Start Date *"
                            validateStatus={errors.startDate && touched.startDate ? "error" : ""}
                            help={touched.startDate && errors.startDate ? errors?.startDate : null}
                        >
                            <DatePicker
                                showTime
                                value={values.startDate ? dayjs(values.startDate?.toString()) : null}
                                onChange={(date) => setFieldValue("startDate", date)}
                            />
                        </Form.Item>
                        <Form.Item
                            label="End Date *"
                            validateStatus={errors.endDate && touched.endDate ? "error" : ""}
                            help={touched.endDate && errors.endDate ? errors.endDate : null}
                        >
                            <DatePicker
                                showTime
                                value={values.endDate ? dayjs(values.endDate?.toString()) : null}
                                onChange={(date) => setFieldValue("endDate", date)}
                            />
                        </Form.Item>
                        <Form.Item label="Visibility">
                            <Checkbox
                                checked={values.visibleOnWeb}
                                onChange={(e) => setFieldValue("visibleOnWeb", e.target.checked)}
                            >
                                Web
                            </Checkbox>
                            <Checkbox
                                checked={values.visibleOnExtension}
                                onChange={(e) => setFieldValue("visibleOnExtension", e.target.checked)}
                            >
                                Extension
                            </Checkbox>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {initialValues.id ? "Update" : "Create"}
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default NotificationModal;
