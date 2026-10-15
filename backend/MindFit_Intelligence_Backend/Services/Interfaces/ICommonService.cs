using MindFit_Intelligence_Backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ICommonService <T, TI, TU>
    {
        public Task<IEnumerable<T>> Get();
        public Task<T?> GetById(int id);
        public Task<T> Add(TI typeInsertDto);
        public Task<T?> Update(int id, TU typeUpdateDto);
        public Task<T?> Delete(int id);
    }
}
