import {
  parseRequestUrl,
  showLoading,
  hideLoading,
  showMessage,
  rerender,
} from '../utils';
import { getOrder, getPaypalClientId, payOrder, deliverOrder } from '../api';
import { getUserInfo } from '../localStorage';

const addPaypalSdk = async (totalPrice) => {
  const clientId = await getPaypalClientId();
  showLoading();
  if (!window.paypal) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.paypalobjects.com/api/checkout.js';
    script.async = true;
    script.onload = () => handlePayment(clientId, totalPrice);
    document.body.appendChild(script);
  } else {
    handlePayment(clientId, totalPrice);
  }
};
const handlePayment = (clientId, totalPrice) => {
  window.paypal.Button.render(
    {
      env: 'sandbox',
      client: {
        sandbox: clientId,
        production: '',
      },
      locale: 'en_US',
      style: {
        size: 'responsive',
        color: 'gold',
        shape: 'pill',
      },

      commit: true,
      payment(data, actions) {
        return actions.payment.create({
          transactions: [
            {
              amount: {
                total: totalPrice,
                currency: 'R$',
              },
            },
          ],
        });
      },
      onAuthorize(data, actions) {
        return actions.payment.execute().then(async () => {
          showLoading();
          await payOrder(parseRequestUrl().id, {
            orderID: data.orderID,
            payerID: data.payerID,
            paymentID: data.paymentID,
          });
          hideLoading();
          showMessage('Pagamento Realizado com Sucesso.', () => {
            rerender(OrderScreen);
          });
        });
      },
    },
    '#paypal-button'
  ).then(() => {
    hideLoading();
  });
};
const OrderScreen = {
  after_render: async () => {
    const request = parseRequestUrl();
    if (document.getElementById('deliver-order-button')) {
      document.addEventListener('click', async () => {
        showLoading();
        await deliverOrder(request.id);
        hideLoading();
        showMessage('Pedido Enviado.');
        rerender(OrderScreen);
      });
    }
  },
  render: async () => {
    const { isAdmin } = getUserInfo();
    const request = parseRequestUrl();
    const {
      _id,
      shipping,
      payment,
      orderItems,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isDelivered,
      deliveredAt,
      isPaid,
      paidAt,
    } = await getOrder(request.id);
    if (!isPaid) {
      addPaypalSdk(totalPrice);
    }
    return `
    <div>
    <h1>Order ${_id}</h1>
      <div class="order">
        <div class="order-info">
          <div>
            <h2>Enviados</h2>
            <div>
            ${shipping.address}, ${shipping.city}, ${shipping.postalCode}, 
            ${shipping.country}
            </div>
            ${
              isDelivered
                ? `<div class="success">Delivered at ${deliveredAt}</div>`
                : `<div class="error">N??o entregue</div>`
            }
             
          </div>
          <div>
            <h2>Pagamento</h2>
            <div>
              Metodo de Pagamento  : ${payment.paymentMethod}
            </div>
            ${
              isPaid
                ? `<div class="success">Pago em ${paidAt}</div>`
                : `<div class="error">Sem Pagamento</div>`
            }
          </div>
          <div>
            <ul class="cart-list-container">
              <li>
                <h2>Carrinho de compras</h2>
                <div>Pre??o</div>
              </li>
              ${orderItems
                .map(
                  (item) => `
                <li>
                  <div class="cart-image">
                    <img src="${item.image}" alt="${item.name}" />
                  </div>
                  <div class="cart-name">
                    <div>
                      <a href="/#/product/${item.product}">${item.name} </a>
                    </div>
                    <div> Qtd: ${item.qty} </div>
                  </div>
                  <div class="cart-price"> R$${item.price}</div>
                </li>
                `
                )
                .join('\n')}
            </ul>
          </div>
        </div>
        <div class="order-action">
           <ul>
                <li>
                  <h2>Resumo do Pedido</h2>
                 </li>
                 <li><div>Itens</div><div>R$${itemsPrice}</div></li>
                 <li><div>Envio</div><div>R$${shippingPrice}</div></li>
                 <li><div>Taxa</div><div>R$${taxPrice}</div></li>
                 <li class="total"><div>Total Pedido</div><div>R$${totalPrice}</div></li>                  
                 <li><div class="fw" id="paypal-button"></div></li>
                 <li>
                 ${
                   isPaid && !isDelivered && isAdmin
                     ? `<button id="deliver-order-button" class="primary fw">Enviar Pedido</button>`
                     : ''
                 }
                 <li>
               
        </div>
      </div>
    </div>
    `;
  },
};
export default OrderScreen;
