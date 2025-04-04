export function handleBrivoAuthRedirect(tenant: string) {
  const formData = {
    response_type: "code",
    client_id: import.meta.env.VITE_BRIVO_CLIENT_ID,
    state: tenant,
  };

  const form = document.createElement("form");
  form.action = import.meta.env.VITE_BRIVO_HOST;
  form.method = "POST";
  form.target = "_blank";

  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);

  form.submit();

  document.body.removeChild(form);
}
