import {Router, listen} from 'worktop';
import faunadb from 'faunadb';
import {getFaunaError} from './utils.js';

const router = new Router();

const faunaClient = new faunadb.Client({
  secret: FAUNA_SECRET,
});

const {Create, Collection, Match, Index, Get, Ref, Paginate, Sum, Delete, Add, Select, Let, Var, Update} = faunadb.query;

router.add('GET', '/', async (request, response) => {
  response.send(200, 'hello world');
});

listen(router.run);

router.add('GET', '/products/:productId', async (request, response) => {
  try {
    const productId = request.params.productId;

    const result = await faunaClient.query(
      Get(Ref(Collection('Products'), productId))
    );

    response.send(200, result);

  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});

router.add('POST', '/products', async (request, response) => {
  try {
    const {serialNumber, title, weightLbs} = await request.body();

    const result = await faunaClient.query(
      Create(
        Collection('Products'),
        {
          data: {
            serialNumber,
            title,
            weightLbs,
            quantity: 0
          }
        }
      )
    );

    response.send(200, {
      productId: result.ref.id
    });
  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});

router.add('PATCH', '/products/:productId/add-quantity', async (request, response) => {
  try {
    const productId = request.params.productId;
    const {quantity} = await request.body();

    const result = await faunaClient.query(
      Let(
        {
          productRef: Ref(Collection('Products'), productId),
          productDocument: Get(Var('productRef')),
          currentQuantity: Select(['data', 'quantity'], Var('productDocument'))
        },
        Update(
          Var('productRef'),
          {
            data: {
              quantity: Add(
                Var('currentQuantity'),
                quantity
              )
            }
          }
        )
      )
    );

    response.send(200, result);
  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});

router.add('DELETE', '/products/:productId', async (request, response) => {
  try {
    const productId = request.params.productId;

    const result = await faunaClient.query(
      Delete(Ref(Collection('Products'), productId))
    );

    response.send(200, result);
  } catch (error) {
    const faunaError = getFaunaError(error);
    response.send(faunaError.status, faunaError);
  }
});