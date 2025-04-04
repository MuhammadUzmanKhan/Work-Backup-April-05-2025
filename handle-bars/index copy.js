const fs = require('fs')
const handlebars = require('handlebars')
const pdf = require('html-pdf')
// const handlebarsPdf = require('handlebars-pdf')
// const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

async function createPDF() {
  const templateHtml = fs.readFileSync('./pdf-templates/pdfs/ejection-form.hbs', 'utf8')
  // console.log(templateHtml)
  const template = handlebars.compile(templateHtml)

  // Define the custom helper function
  handlebars.registerHelper('eq', (a, b) => a == b)

  // const doc = new PDFDocument();

  /**
 * Company
Company Logo
Event Name
Description
Genres
Active modules
Location
Venue
Event Dates
Time Zone
 */
  // const data = {
  //   company: 'Testing company 12',
  //   companyLogo: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/d273861677855081/download.jpeg',
  //   eventName: 'Testing Event By Numan',
  //   genres: 'EDM' + ' Metal' + ' Latin',
  //   description: 'This event is a testing event. Created for PDF testing.',
  //   venue: 'Test',
  //   location: 'International Dr, Orlando, FL, USA',
  //   timezone: 'Asia/Kolkata',
  //   eventDates: 'From 2023-02-02' + ' To 2023-02-07',
  //   activeModules:'Incidents, Workforce, Dot Map System'
  // }
  const data = {
    // id: 306,
    // event_id: 2191,
    // form_type: 'ejection',
    // is_incident: true,
    // witness: true,
    // police_report: false,
    // medical_treatment: 'yes',
    // emergency_contact: true,
    // department_id: 578,
    // incident_zone_id: 3787,
    // description: 'sdsdd',
    // mechanism_of_injury: '',
    // chief_complaint: '',
    // treatment_provided: '',
    // treatment_provided_by: '',
    // patient_narrative: '',
    // source_type: 'web',
    // created_at: '2023-11-09T05:18:42.559-05:00',
    // report_type: null,
    // time_report_taken: null,
    // note: '',
    // updated_by_id: 7,
    // updated_by_type: 'User',
    // vehicle_detail: '',
    // hospital_detail: '',
    // reporter_narrative: 'evccvdvecc',
    // treatment_location: '',
    // reason: '',
    // affected_person: 50,
    // section: '',
    // row: '',
    // seat: '',
    // reason_type: 'Assault',
    // report_location_id: 3787,
    // incident_images: [],
    // reporter_writer: {
    //   first_name: 'Jack',
    //   last_name: 'SuperAdmin',
    //   cad_incident_number: null,
    //   reporter_narrative: 'evccvdvecc',
    //   image_url: {
    //     id: 7052,
    //     url: 'http://ontrackdevelopment.s3.amazonaws.com/images/8b98f17b171699525122/image.png',
    //     image_type: 'reporter_signature',
    //   },
    // },
    // representatives: [
    //   {
    //     id: 145,
    //     first_name: '',
    //     last_name: '',
    //     department_name: '',
    //   },
    // ],
    // witnesses: [
    //   {
    //     id: 265,
    //     first_name: 'wdwd',
    //     last_name: 'fefwf',
    //     email: '',
    //     cell: '31233223423',
    //     country_code: '+1',
    //     country_iso_code: 'us',
    //   },
    // ],
    // incident_zone: {
    //   id: 3787,
    //   name: 'Event Area',
    // },
    // department: {
    //   id: 578,
    //   name: 'Administration Department',
    // },
    // location: {
    //   id: 463769,
    //   longitude: '-73.60006834650142',
    //   latitude: '45.52601359299949',
    // },
    // event: {
    //   id: 2191,
    //   name: 'Assassins Creed Syndicate ',
    //   start_date: '2023-11-13',
    //   end_date: '2023-11-17',
    //   event_location: '5505 Boul. Saint-Laurent #2000, Montréal, QC H2T 1S6, Canada',
    //   venue_name: 'Ubisoft Montreal',
    // },
    // person_involveds: [
    //   {
    //     id: 332,
    //     first_name: 'edwefwefwefwe',
    //     last_name: 'fwedfwedf',
    //     gender: 'male',
    //     cell: '3223',
    //     email: '',
    //     address: '',
    //     credential_type: '',
    //     country_code: '+1',
    //     country_iso_code: 'us',
    //     id_proof_no: 'fewfwef',
    //     birth_date: '2023-11-01',
    //     incident_form_id: 306,
    //     created_at: '2023-11-09T05:18:42.680-05:00',
    //     description: 'cdcdws',
    //     mailing_address: null,
    //     location_detail: null,
    //     staff_detail: '',
    //     images: [
    //       {
    //         id: 7053,
    //         url: 'http://ontrackdevelopment.s3.amazonaws.com/images/cea903190e1699525122/image.png',
    //         image_type: 'person_signature',
    //       },
    //     ],
    //   },
    // ],
    id: 163,
    event_id: 2098,
    event_end_date: '2023-11-17',
    event_start_date: '2023-11-13',
    form_type: 'ejection',
    is_incident: true,
    witness: true,
    police_report: true,
    medical_treatment: 'yes',
    emergency_contact: true,
    department_id: 481,
    incident_zone_id: 3645,
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    mechanism_of_injury: '',
    chief_complaint: '',
    treatment_provided: '',
    treatment_provided_by: '',
    patient_narrative: '',
    source_type: 'web',
    created_at: '2023-10-31T11:25:17.333+05:30',
    report_type: null,
    time_report_taken: null,
    note: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. 6666",
    vehicle_detail: '',
    hospital_detail: '',
    treatment_location: '',
    reason:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    affected_person: 5,
    section: 'A',
    row: '3',
    seat: '2',
    reason_type: 'Other',
    report_location_id: 3645,
    incident_images: [
      {
        id: 5945,
        updated_at: '2023-10-31T11:25:17.358+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/fd9209345c1698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5946,
        updated_at: '2023-10-31T11:25:17.441+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/df08ea42c71698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5947,
        updated_at: '2023-10-31T11:25:17.537+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/de254c3e381698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5948,
        updated_at: '2023-10-31T11:25:17.622+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/12efb7d8721698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5949,
        updated_at: '2023-10-31T11:25:17.729+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/a0d997df9a1698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5950,
        updated_at: '2023-10-31T11:25:17.802+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/c74a95c1df1698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5951,
        updated_at: '2023-10-31T11:25:17.903+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/82ad285efc1698731717/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5952,
        updated_at: '2023-10-31T11:25:17.982+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/8f821859d41698731718/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5953,
        updated_at: '2023-10-31T11:25:18.058+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/2e4755332b1698731718/image.jpeg',
        image_type: 'incident',
      },
      {
        id: 5954,
        updated_at: '2023-10-31T11:25:18.166+05:30',
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/a52d3cc7371698731718/image.jpeg',
        image_type: 'incident',
      },
    ],
    incident_area_images: [],
    reporter_writer: {
      first_name: 'Mr.',
      last_name: 'Gryffin',
      cad_incident_number: null,
      reporter_narrative:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      image_url: {
        id: 5955,
        url: 'http://ontrackdevelopment.s3.amazonaws.com/images/60bece483d1698731718/image.png',
        image_type: 'reporter_signature',
      },
    },
    updated_by: {
      id: 7,
      name: 'Mr. Gryffin',
    },
    is_vehicle_related: 'No',
    moved_to_hospital: 'No',
    representatives: [
      {
        id: 2,
        first_name: 'Vini',
        last_name: 'Harry',
        department_name: 'IT',
      },
    ],
    witnesses: [
      {
        id: 122,
        first_name: 'misha',
        last_name: 'jain',
        email: 'mj@gma.co',
        cell: '3344444444',
        country_code: '+1',
        country_iso_code: 'us',
      },
      {
        id: 123,
        first_name: 'Lauren',
        last_name: 'Test',
        email: 'lt@gma.co',
        cell: '4444555555',
        country_code: '+1',
        country_iso_code: 'us',
      },
    ],
    incident_zone: {
      id: 3645,
      name: '[Test - Zone]',
    },
    report_location: {
      id: 3645,
      name: '[Test - Zone]',
    },
    department: {
      id: 481,
      name: 'Aeonext Department',
    },
    location: {
      id: 462016,
      longitude: '75.8930927',
      latitude: '22.7460803',
    },
    incident: {
      id: 7113,
    },
    event: {
      id: 2098,
      name: 'Event 19 oct 2023',
      event_location: 'IT Park Rd, Gayatri Nagar, Pratap Nagar, Nagpur, Maharashtra 440022, India',
      venue_name: 'it park',
    },
    person_involveds: [
      {
        id: 168,
        first_name: 'Mayra',
        last_name: 'Sharma',
        gender: 'female',
        cell: '3333333333',
        email: 'ms@gma.co',
        address: '45 A Test',
        credential_type: ' ',
        country_code: '+1',
        country_iso_code: 'us',
        id_proof_no: '454555555',
        birth_date: '2005-10-11',
        incident_form_id: 163,
        created_at: '2023-10-31T11:25:18.371+05:30',
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        mailing_address: null,
        location_detail: null,
        staff_detail:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        is_address_different: 'Yes',
        is_staff_involved: 'Yes',
        images: [
          {
            id: 5956,
            url: 'http://ontrackdevelopment.s3.amazonaws.com/images/e18cd660dc1698731718/image.png',
            image_type: 'id_proof',
          },
          {
            id: 5957,
            url: 'http://ontrackdevelopment.s3.amazonaws.com/images/1438fcb6de1698731718/image.png',
            image_type: 'person_signature',
          },
        ],
      },
      {
        id: 169,
        first_name: 'Sasha',
        last_name: 'Jain',
        gender: 'female',
        cell: '4444444444',
        email: 'sj@gma.co',
        address: '56 A Test',
        credential_type: ' ',
        country_code: '+1',
        country_iso_code: 'us',
        id_proof_no: '4666655555',
        birth_date: '2000-10-10',
        incident_form_id: 163,
        created_at: '2023-10-31T11:25:18.611+05:30',
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        mailing_address: null,
        location_detail: null,
        staff_detail: 'Details',
        is_address_different: 'Yes',
        is_staff_involved: 'Yes',
        images: [
          {
            id: 5958,
            url: 'http://ontrackdevelopment.s3.amazonaws.com/images/f1bec916ce1698731718/image.png',
            image_type: 'id_proof',
          },
          {
            id: 5959,
            url: 'http://ontrackdevelopment.s3.amazonaws.com/images/325929f7091698731718/image.png',
            image_type: 'person_signature',
          },
        ],
      },
    ],
  }

  console.log(data)
  const html = template(data)
  // doc.image(html, { fit: [500, 500], align: 'center', valign: 'center' })

  // Save the PDF document to a file
  // doc.pipe(fs.createWriteStream('./events.pdf'))
  // doc.end()
  // pdf.create(html).toFile('./events.pdf', (err, res) => {
  //   if (err) {
  //     console.log(err)
  //     return
  //   }
  //   console.log(res)
  // })
  // let document = {
  //   template: templateHtml,
  //   context: data,
  //   path: './company.pdf',
  // }

  // handlebarsPdf
  //   .create(document)
  //   .then((res) => {
  //     console.log(res)
  //   })
  //   .catch((error) => {
  //     console.error(error)
  //   })

  // const headerTemplate =
  //   '<div class="top-bg"><img src="https://svgshare.com/i/zew.svg" alt="bg-top" width="100%" /></div><div class="pdf-page-header"><a href="#"><img src="https://i.postimg.cc/0yrGxtXk/logo.png" width="100" alt="logo" /></a><span class="h-text">Security | Ejection Form </span></div>'
  // const footerTemplate = '<div style="font-size: 12px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'

  // const headerTemplate = '<div style="font-size: 12px; text-align: center; width: 100%; position: absolute; top: 0;">Header</div>'
  // const footerTemplate = '<div style="font-size: 12px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'

  const options = {
    format: 'A4',
    // width: '1230px',
    displayHeaderFooter: true,
    margin: {
      top: '10px',
      bottom: '30px',
    },
    printBackground: true,
    // headerTemplate: headerTemplate,
    // footerTemplate: footerTemplate,
    path: './ejection-form.pdf',
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true,
  })
  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: 'networkidle0',
    timeout: 0,
  })

  await page.pdf(options)

  await browser.close()
}

createPDF()