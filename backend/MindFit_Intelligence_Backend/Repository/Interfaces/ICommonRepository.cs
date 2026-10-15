namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface ICommonRepository<TEntity>
    {
        Task<IEnumerable<TEntity>> Get();

        Task<TEntity?> GetById(int id);

        Task Add(TEntity entity);

        void Update(TEntity entity);

        void Delete(TEntity entity);

        Task Save();

        //IEnumerable<TEntity> Search(Func<TEntity, bool> filter);
    }
}
