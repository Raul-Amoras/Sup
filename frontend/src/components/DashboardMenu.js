const DashboardMenu = {
  render: (props) => {
    return `
    <div class="dashboard-menu">
      <ul>
        <li class="${props.selected === 'dashboard' ? 'selected' : ''}">
          <a href="/#/dashboard">Dashboard</a>
        </li>
        <li class="${props.selected === 'orders' ? 'selected' : ''}">
          <a href="/#/orderlist">Pedidos</a>
        </li>
        <li class="${props.selected === 'products' ? 'selected' : ''}">
          <a href="/#/productlist">Produtos</a>
        </li>
        <li class="${props.selected === 'client' ? 'selected' : ''}">
        <a href="/#/productlist">Clientes</a>
      </li>
      </ul>
    </div>
    `;
  },
};
export default DashboardMenu;
