using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using MyWebSite.DAL;
namespace MyWebSite
{
    public partial class Home : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            LoadGrid();

        }
        public void LoadGrid()
        {
            MyDAL objMyDal = new MyDAL();
            ItemGrid.DataSource = objMyDal.SelectItem();
            ItemGrid.DataBind();
        }
    }
}